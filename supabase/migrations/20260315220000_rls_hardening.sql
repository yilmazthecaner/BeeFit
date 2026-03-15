-- Allow update on meal_items for authenticated users
CREATE POLICY "Users can update own meal items"
    ON meal_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs
            WHERE meal_logs.id = meal_items.meal_id
            AND meal_logs.user_id = auth.uid()
        )
    );

-- Allow delete on meal_items for authenticated users
CREATE POLICY "Users can delete own meal items"
    ON meal_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM meal_logs
            WHERE meal_logs.id = meal_items.meal_id
            AND meal_logs.user_id = auth.uid()
        )
    );

-- Storage Policies for meal-photos bucket
CREATE POLICY "Users can upload meal photos"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'meal-photos' AND auth.uid() = owner );

CREATE POLICY "Users can update own meal photos"
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'meal-photos' AND auth.uid() = owner );

CREATE POLICY "Users can delete own meal photos"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'meal-photos' AND auth.uid() = owner );
