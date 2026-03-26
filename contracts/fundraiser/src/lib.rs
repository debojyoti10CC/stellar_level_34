#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol, Vec,
    token,
};

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

const COUNTER: Symbol = symbol_short!("COUNTER");
const XLM_SAC: Symbol = symbol_short!("XLMSAC");

#[contractimpl]
impl MicroFund {
    /// Call once after deploy: pass the native XLM SAC address.
    /// On testnet you can get it with:
    ///   stellar contract id asset --asset native --network testnet
    pub fn initialize(env: Env, xlm_sac: Address) {
        if env.storage().instance().has(&XLM_SAC) {
            panic!("already initialized");
        }
        env.storage().instance().set(&XLM_SAC, &xlm_sac);
        env.storage().instance().set(&COUNTER, &0u32);
    }

    pub fn create_campaign(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        goal: i128,
        deadline: u64,
    ) -> u32 {
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

    /// Donate `amount` stroops of XLM to a campaign.
    /// 1 XLM = 10_000_000 stroops.
    pub fn donate(env: Env, donor: Address, campaign_id: u32, amount: i128) {
        donor.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&campaign_id)
            .expect("campaign not found");

        if env.ledger().timestamp() >= campaign.deadline {
            panic!("campaign expired");
        }

        let xlm_sac: Address = env.storage().instance().get(&XLM_SAC).unwrap();
        let xlm = token::Client::new(&env, &xlm_sac);

        // Transfer XLM (in stroops) from donor to this contract
        xlm.transfer(&donor, &env.current_contract_address(), &amount);

        campaign.amount_raised += amount;
        env.storage().persistent().set(&campaign_id, &campaign);
        env.events().publish((symbol_short!("donated"), campaign_id), donor);
    }

    /// Withdraw raised XLM to the creator (only when goal met or deadline passed).
    pub fn withdraw(env: Env, campaign_id: u32) {
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&campaign_id)
            .expect("campaign not found");
        campaign.creator.require_auth();

        if campaign.withdrawn {
            panic!("already withdrawn");
        }
        let can_withdraw = campaign.amount_raised >= campaign.goal
            || env.ledger().timestamp() >= campaign.deadline;
        if !can_withdraw {
            panic!("cannot withdraw yet");
        }

        let xlm_sac: Address = env.storage().instance().get(&XLM_SAC).unwrap();
        let xlm = token::Client::new(&env, &xlm_sac);

        xlm.transfer(
            &env.current_contract_address(),
            &campaign.creator,
            &campaign.amount_raised,
        );

        campaign.withdrawn = true;
        env.storage().persistent().set(&campaign_id, &campaign);
        env.events()
            .publish((symbol_short!("withdrawn"), campaign_id), campaign.creator.clone());
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
