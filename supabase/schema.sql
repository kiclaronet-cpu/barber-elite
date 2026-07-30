-- ============================================
-- BARBER ELITE - SUPABASE SCHEMA
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar TEXT,
    role VARCHAR(20) DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barbers
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    photo TEXT,
    description TEXT,
    specialties TEXT[],
    rating DECIMAL(2,1) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    image TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites (cliente -> barber)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, barber_id)
);

-- Barber availability (weekly schedule)
CREATE TABLE barber_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN DEFAULT true,
    UNIQUE(barber_id, day_of_week)
);

-- Blocked time slots (vacations, breaks)
CREATE TABLE blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percent INTEGER,
    code VARCHAR(50) UNIQUE,
    active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_reviews_barber ON reviews(barber_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_barbers_updated_at
    BEFORE UPDATE ON barbers FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS: Enable row-level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies: Barbers
CREATE POLICY "Anyone can view active barbers"
    ON barbers FOR SELECT
    USING (active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage barbers"
    ON barbers FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies: Services
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    USING (active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage services"
    ON services FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies: Appointments
CREATE POLICY "Users can view own appointments"
    ON appointments FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own appointments"
    ON appointments FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies: Reviews
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Favorites
CREATE POLICY "Users can manage own favorites"
    ON favorites FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies: Notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- RLS Policies: Promotions
CREATE POLICY "Anyone can view active promotions"
    ON promotions FOR SELECT
    USING (active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage promotions"
    ON promotions FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies: Barber availability
CREATE POLICY "Anyone can view barber availability"
    ON barber_availability FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage availability"
    ON barber_availability FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies: Blocked slots
CREATE POLICY "Anyone can view blocked slots"
    ON blocked_slots FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage blocked slots"
    ON blocked_slots FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed data: Services
INSERT INTO services (name, description, price, duration) VALUES
('Corte Premium', 'Corte personalizado com tesoura e máquina, finalização com produtos premium', 65.00, 45),
('Barba Completa', 'Barba feita com navalha, toalha quente, balm e pós-barba', 45.00, 30),
('Combo Corte + Barba', 'Nosso combo mais popular: corte premium + barba completa', 95.00, 90),
('Hidratação Capilar', 'Tratamento profundo com queratina e óleos essenciais', 55.00, 35),
('Pigmentação', 'Disfarce de fios brancos com pigmentação natural', 70.00, 40),
('Corte Infantil', 'Corte especial para crianças em ambiente lúdico', 45.00, 30),
('Sobrancelha', 'Design de sobrancelha masculina com pinça e navalha', 25.00, 15),
('Combo Completo', 'Corte + barba + hidratação + sobrancelha', 150.00, 120);

-- Seed data: Barbers
INSERT INTO barbers (name, description, specialties, rating) VALUES
('Carlos Silva', 'Especialista em cortes clássicos e modernos com mais de 10 anos de experiência.', ARRAY['Cortes Clássicos', 'Cortes Modernos', 'Barba Tradicional'], 4.9),
('André Santos', 'Mestre barbeiro formado em Milão, referência em barba e navalha.', ARRAY['Barba', 'Navalha', 'Corte Degradê'], 4.8),
('Rafael Oliveira', 'Expert em designs criativos e pigmentação capilar.', ARRAY['Designs', 'Pigmentação', 'Corte Infantil'], 4.9),
('Lucas Costa', 'Especialista em colorimetria masculina e tratamentos capilares.', ARRAY['Colorimetria', 'Hidratação', 'Corte Premium'], 4.7),
('Gabriel Martins', 'Jovem talento especializado em cortes contemporâneos e degradê.', ARRAY['Degradê', 'Corte Social', 'Sobrancelha'], 4.8);
