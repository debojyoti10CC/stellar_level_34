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

// Integration test for donation would require Token registration
// For now, testing basic campaign management
