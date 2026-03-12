-- Allow authenticated users to INSERT their own profile (needed for sign-up)
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow insert on meal_items for authenticated users
CREATE POLICY "Users can insert own meal items"
    ON meal_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_logs
            WHERE meal_logs.id = meal_items.meal_id
            AND meal_logs.user_id = auth.uid()
        )
    );

-- Allow insert on ai_context_entries
CREATE POLICY "Users can insert own context"
    ON ai_context_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);
