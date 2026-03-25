#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_initialize_and_mint() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let to = Address::generate(&env);

    let contract_id = env.register_contract(None, MicroToken);
    let client = MicroTokenClient::new(&env, &contract_id);

    env.mock_all_auths();
    client.initialize(&admin);
    client.mint(&to, &1000);

    assert_eq!(client.balance_of(&to), 1000);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = env.register_contract(None, MicroToken);
    let client = MicroTokenClient::new(&env, &contract_id);

    env.mock_all_auths();
    client.initialize(&admin);
    client.mint(&user1, &500);

    client.transfer(&user1, &user2, &200);

    assert_eq!(client.balance_of(&user1), 300);
    assert_eq!(client.balance_of(&user2), 200);
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn test_transfer_insufficient_balance() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let contract_id = env.register_contract(None, MicroToken);
    let client = MicroTokenClient::new(&env, &contract_id);

    env.mock_all_auths();
    client.initialize(&admin);
    client.mint(&user1, &100);

    client.transfer(&user1, &user2, &200);
}
