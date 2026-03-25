#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_create_campaign() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, MicroFund);
    let client = MicroFundClient::new(&env, &contract_id);

    client.initialize(&token);

    let title = String::from_str(&env, "Test Project");
    let description = String::from_str(&env, "Test Description");
    let goal = 1000;
    let deadline = env.ledger().timestamp() + 3600;

    let id = client.create_campaign(&creator, &title, &description, &goal, &deadline);
    assert_eq!(id, 0);

    let campaign = client.get_campaign(&0);
    assert_eq!(campaign.title, title);
    assert_eq!(campaign.goal, goal);
}

#[test]
#[should_panic(expected = "goal must be positive")]
fn test_create_campaign_invalid_goal() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, MicroFund);
    let client = MicroFundClient::new(&env, &contract_id);

    client.initialize(&token);

    let title = String::from_str(&env, "Bad Project");
    let description = String::from_str(&env, "Bad Description");
    let goal = -100;
    let deadline = env.ledger().timestamp() + 3600;

    client.create_campaign(&creator, &title, &description, &goal, &deadline);
}

#[test]
#[should_panic(expected = "deadline must be in future")]
fn test_create_campaign_old_deadline() {
    let env = Env::default();
    let creator = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register_contract(None, MicroFund);
    let client = MicroFundClient::new(&env, &contract_id);

    client.initialize(&token);

    let title = String::from_str(&env, "Old Project");
    let description = String::from_str(&env, "Old Description");
    let goal = 1000;
    let deadline = 10; // clearly in the past

    client.create_campaign(&creator, &title, &description, &goal, &deadline);
}
