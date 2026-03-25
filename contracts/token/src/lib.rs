#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

#[contract]
pub struct MicroToken;

const BALANCE: Symbol = symbol_short!("BALANCE");
const ADMIN: Symbol = symbol_short!("ADMIN");

#[contractimpl]
impl MicroToken {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let balance: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        env.storage().persistent().set(&to, &(balance + amount));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let from_balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient balance");
        }

        env.storage().persistent().set(&from, &(from_balance - amount));

        let to_balance: i128 = env.storage().persistent().get(&to).unwrap_or(0);
        env.storage().persistent().set(&to, &(to_balance + amount));
    }

    pub fn balance_of(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&user).unwrap_or(0)
    }
}

mod test;
