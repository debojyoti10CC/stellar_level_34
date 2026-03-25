#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

mod token {
    soroban_sdk::contractimport!(file = "../../target/wasm32v1-none/release/micro_token.wasm");
}

#[derive(Clone)]
#[contracttype]
pub struct Campaign {
    pub id: u32,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub goal: i128,
    pub amount_raised: i128,
    pub deadline: u64,
    pub withdrawn: bool,
}

#[contract]
pub struct MicroFund;

const TOKEN: Symbol = symbol_short!("TOKEN");
const COUNTER: Symbol = symbol_short!("COUNTER");

#[contractimpl]
impl MicroFund {
    pub fn initialize(env: Env, token: Address) {
        if env.storage().instance().has(&TOKEN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&TOKEN, &token);
        env.storage().instance().set(&COUNTER, &0u32);
    }

    pub fn create_campaign(env: Env, creator: Address, title: String, description: String, goal: i128, deadline: u64) -> u32 {
        creator.require_auth();

        if goal <= 0 {
            panic!("goal must be positive");
        }
        if deadline <= env.ledger().timestamp() {
            panic!("deadline must be in future");
        }

        let id: u32 = env.storage().instance().get(&COUNTER).unwrap();
        let campaign = Campaign {
            id,
            creator: creator.clone(),
            title,
            description,
            goal,
            amount_raised: 0,
            deadline,
            withdrawn: false,
        };

        env.storage().persistent().set(&id, &campaign);
        env.storage().instance().set(&COUNTER, &(id + 1));

        env.events().publish((symbol_short!("created"), id), creator);

        id
    }

    pub fn donate(env: Env, donor: Address, campaign_id: u32, amount: i128) {
        donor.require_auth();

        let mut campaign: Campaign = env.storage().persistent().get(&campaign_id).expect("campaign not found");

        if env.ledger().timestamp() >= campaign.deadline {
            panic!("campaign expired");
        }

        let token_address: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        
        // Transfer tokens from donor to this contract
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        campaign.amount_raised += amount;
        env.storage().persistent().set(&campaign_id, &campaign);

        env.events().publish((symbol_short!("donated"), campaign_id), donor);
    }

    pub fn withdraw(env: Env, campaign_id: u32) {
        let mut campaign: Campaign = env.storage().persistent().get(&campaign_id).expect("campaign not found");
        campaign.creator.require_auth();

        if campaign.withdrawn {
            panic!("already withdrawn");
        }

        let can_withdraw = campaign.amount_raised >= campaign.goal || env.ledger().timestamp() >= campaign.deadline;

        if !can_withdraw {
            panic!("cannot withdraw yet");
        }

        let token_address: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_address);

        token_client.transfer(&env.current_contract_address(), &campaign.creator, &campaign.amount_raised);

        campaign.withdrawn = true;
        env.storage().persistent().set(&campaign_id, &campaign);

        env.events().publish((symbol_short!("withdrawn"), campaign_id), campaign.creator.clone());
    }

    pub fn get_campaign(env: Env, id: u32) -> Campaign {
        env.storage().persistent().get(&id).expect("campaign not found")
    }

    pub fn get_campaigns(env: Env) -> Vec<Campaign> {
        let count: u32 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        let mut campaigns = Vec::new(&env);
        for i in 0..count {
            if let Some(c) = env.storage().persistent().get(&i) {
                campaigns.push_back(c);
            }
        }
        campaigns
    }
}

mod test;
