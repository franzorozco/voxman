ALTER TABLE expenses ADD COLUMN split_type VARCHAR(20) DEFAULT 'single_owner' CHECK (split_type IN ('equal', 'proportional', 'custom', 'single_owner'));

CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE owner_payments ADD COLUMN type VARCHAR(20) DEFAULT 'withdrawal' CHECK (type IN ('withdrawal', 'deposit'));
