# SQL Schema Examples para Sistema Agrícola

## Estrutura do Banco de Dados PostgreSQL

### 1. Criação do Schema Principal
```sql
-- Criação do schema principal
CREATE SCHEMA IF NOT EXISTS farm_management;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. Configurações de Performance
```sql
-- Configurações de performance para PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configuração do PostGIS para melhor performance
ALTER DATABASE farmdb SET postgis.gdal_enabled_drivers = 'ENABLE_ALL';
```

## Esquemas das Tabelas Principais

### 1. Fazenda (Fazenda Master Data)
```sql
CREATE TABLE farm_management.farms (
    farm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_code VARCHAR(50) UNIQUE NOT NULL,
    fantasy_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    owner_name VARCHAR(255) NOT NULL,
    owner_document VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(255),
    address_city VARCHAR(255),
    address_state CHAR(2),
    address_zip_code VARCHAR(10),
    address_lat DECIMAL(10, 8),
    address_lng DECIMAL(11, 8),
    total_area_hectares DECIMAL(12, 4) NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    status CHAR(1) DEFAULT 'A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Índices para performance
CREATE INDEX idx_farms_farm_code ON farm_management.farms(farm_code);
CREATE INDEX idx_farms_status ON farm_management.farms(status);
CREATE INDEX idx_farms_registration_date ON farm_management.farms(registration_date);
CREATE INDEX idx_farms_location ON farm_management.farms(address_lat, address_lng);
CREATE INDEX idx_farms_gin ON farm_management.farms USING GIN(fantasy_name gin_trgm_ops);
```

### 2. Área (Farm Areas)
```sql
CREATE TABLE farm_management.farm_areas (
    area_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_management.farms(farm_id) ON DELETE CASCADE,
    area_code VARCHAR(50) NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    area_description TEXT,
    area_type VARCHAR(50) NOT NULL, -- 'IRRIGATED', 'RAINFED', 'HYDROPONIC', 'ORGANIC', 'CONVENTIONAL'
    area_hectares DECIMAL(10, 4) NOT NULL,
    slope_percent DECIMAL(5, 2),
    elevation_meters DECIMAL(8, 2),
    soil_type VARCHAR(100),
    water_source VARCHAR(100),
    irrigation_system VARCHAR(100),
    creation_date DATE DEFAULT CURRENT_DATE,
    status CHAR(1) DEFAULT 'A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(farm_id, area_code)
);

CREATE INDEX idx_farm_areas_farm_id ON farm_management.farm_areas(farm_id);
CREATE INDEX idx_farm_areas_area_code ON farm_management.farm_areas(area_code);
CREATE INDEX idx_farm_areas_area_type ON farm_management.farm_areas(area_type);
CREATE INDEX idx_farm_areas_status ON farm_management.farm_areas(status);
CREATE INDEX idx_farm_areas_gin ON farm_management.farm_areas USING GIN(area_name gin_trgm_ops);
```

### 3. Talhão (Field Plots)
```sql
CREATE TABLE farm_management.field_plots (
    plot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm_management.farms(farm_id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES farm_management.farm_areas(area_id) ON DELETE CASCADE,
    plot_code VARCHAR(50) NOT NULL,
    plot_name VARCHAR(255) NOT NULL,
    plot_description TEXT,
    plot_hectares DECIMAL(10, 4) NOT NULL,
    plot_geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    centroid_lat DECIMAL(10, 8),
    centroid_lng DECIMAL(11, 8),
    soil_type VARCHAR(100),
    topography VARCHAR(50), -- 'FLAT', 'GENTLE_SLOPE', 'STEEP_SLOPE', 'ROLLING'
    drainage VARCHAR(50), -- 'GOOD', 'MODERATE', 'POOR', 'EXCESSIVE'
    microclimate VARCHAR(100),
    accessibility_score INTEGER CHECK (accessibility_score >= 1 AND accessibility_score <= 10),
    creation_date DATE DEFAULT CURRENT_DATE,
    status CHAR(1) DEFAULT 'A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(farm_id, area_id, plot_code)
);

-- Índices espaciais e normais
CREATE INDEX idx_field_plots_farm_id ON farm_management.field_plots(farm_id);
CREATE INDEX idx_field_plots_area_id ON farm_management.field_plots(area_id);
CREATE INDEX idx_field_plots_plot_code ON farm_management.field_plots(plot_code);
CREATE INDEX idx_field_plots_geometry ON farm_management.field_plots USING GIST(plot_geometry);
CREATE INDEX idx_field_plots_centroid ON farm_management.field_plots(centroid_lat, centroid_lng);
CREATE INDEX idx_field_plots_status ON farm_management.field_plots(status);
CREATE INDEX idx_field_plots_soil_type ON farm_management.field_plots(soil_type);
CREATE INDEX idx_field_plots_gin ON farm_management.field_plots USING GIN(plot_name gin_trgm_ops);

-- Trigger para calcular centroid
CREATE OR REPLACE FUNCTION update_plot_centroid()
RETURNS TRIGGER AS $$
BEGIN
    NEW.centroid_lat = ST_Y(ST_Centroid(NEW.plot_geometry));
    NEW.centroid_lng = ST_X(ST_Centroid(NEW.plot_geometry));
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plot_centroid
    BEFORE INSERT OR UPDATE ON farm_management.field_plots
    FOR EACH ROW EXECUTE FUNCTION update_plot_centroid();
```

### 4. Visita Técnica (Technical Visits)
```sql
CREATE TABLE farm_management.technical_visits (
    visit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    visit_number VARCHAR(50) NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    visit_duration_minutes INTEGER,
    responsible_technician VARCHAR(255) NOT NULL,
    visit_type VARCHAR(100) NOT NULL, -- 'ROUTINE', 'EMERGENCY', 'HARVEST', 'PLANTING', 'MONITORING'
    visit_objectives TEXT[],
    weather_conditions VARCHAR(100),
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    wind_speed DECIMAL(5, 2),
    soil_moisture VARCHAR(50), -- 'VERY_DRY', 'DRY', 'MOIST', 'WET', 'SOGGY'
    soil_temperature DECIMAL(5, 2),
    plant_health_status VARCHAR(50), -- 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'
    pest_disease_presence BOOLEAN DEFAULT FALSE,
    notes TEXT,
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'COMPLETED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    gps_coordinates GEOMETRY(POINT, 4326),
    photos_count INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_technical_visits_plot_id ON farm_management.technical_visits(plot_id);
CREATE INDEX idx_technical_visits_date ON farm_management.technical_visits(visit_date);
CREATE INDEX idx_technical_visits_technician ON farm_management.technical_visits(responsible_technician);
CREATE INDEX idx_technical_visits_type ON farm_management.technical_visits(visit_type);
CREATE INDEX idx_technical_visits_status ON farm_management.technical_visits(status);
CREATE INDEX idx_technical_visits_coordinates ON farm_management.technical_visits USING GIST(gps_coordinates);
CREATE INDEX idx_technical_visits_number ON farm_management.technical_visits(visit_number);
```

### 5. Análises Específicas (Specific Analysis)
```sql
CREATE TABLE farm_management.specific_analyses (
    analysis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES farm_management.technical_visits(visit_id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    analysis_number VARCHAR(50) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL, -- 'SOIL', 'PLANT_TISSUE', 'WATER', 'CLIMATE', 'PEST_DISEASE'
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sample_collection_date TIMESTAMP WITH TIME ZONE,
    laboratory_name VARCHAR(255),
    responsible_technician VARCHAR(255) NOT NULL,
    objectives TEXT,
    methodology TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED'
    priority VARCHAR(20) DEFAULT 'ROUTINE', -- 'ROUTINE', 'URGENT', 'CRITICAL'
    budget_estimate DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    turnaround_time_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(visit_id, analysis_number)
);

CREATE INDEX idx_specific_analyses_visit_id ON farm_management.specific_analyses(visit_id);
CREATE INDEX idx_specific_analyses_plot_id ON farm_management.specific_analyses(plot_id);
CREATE INDEX idx_specific_analyses_date ON farm_management.specific_analyses(analysis_date);
CREATE INDEX idx_specific_analyses_type ON farm_management.specific_analyses(analysis_type);
CREATE INDEX idx_specific_analyses_status ON farm_management.specific_analyses(status);
CREATE INDEX idx_specific_analyses_laboratory ON farm_management.specific_analyses(laboratory_name);
```

### 6. Amostras (Samples)
```sql
CREATE TABLE farm_management.samples (
    sample_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES farm_management.specific_analyses(analysis_id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    sample_code VARCHAR(100) NOT NULL,
    sample_type VARCHAR(100) NOT NULL, -- 'SOIL_SURFACE', 'SOIL_DEPTH', 'LEAF_TISSUE', 'STEM_TISSUE', 'WATER', 'PLANT_TISSUE'
    sample_date TIMESTAMP WITH TIME ZONE NOT NULL,
    collection_time TIME,
    sample_location GEOMETRY(POINT, 4326),
    depth_cm DECIMAL(5, 2), -- Para amostras de solo
    soil_layer VARCHAR(50), -- 'TOPSOIL', 'SUBSOIL'
    sample_weight_grams DECIMAL(8, 2),
    container_type VARCHAR(100),
    preservation_method VARCHAR(100),
    transport_temperature DECIMAL(5, 2),
    chain_of_custody VARCHAR(500),
    field_conditions TEXT,
    sampling_method VARCHAR(100),
    equipment_used VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'COLLECTED', -- 'COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'PROCESSED', 'DISPOSED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(analysis_id, sample_code)
);

CREATE INDEX idx_samples_analysis_id ON farm_management.samples(analysis_id);
CREATE INDEX idx_samples_plot_id ON farm_management.samples(plot_id);
CREATE INDEX idx_samples_date ON farm_management.samples(sample_date);
CREATE INDEX idx_samples_type ON farm_management.samples(sample_type);
CREATE INDEX idx_samples_status ON farm_management.samples(status);
CREATE INDEX idx_samples_location ON farm_management.samples USING GIST(sample_location);
CREATE INDEX idx_samples_code ON farm_management.samples(sample_code);
```

### 7. Resultados (Test Results)
```sql
CREATE TABLE farm_management.test_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL REFERENCES farm_management.samples(sample_id) ON DELETE CASCADE,
    parameter_code VARCHAR(100) NOT NULL,
    parameter_name VARCHAR(255) NOT NULL,
    parameter_category VARCHAR(100) NOT NULL, -- 'PHYSICAL', 'CHEMICAL', 'BIOLOGICAL', 'MICROBIOLOGICAL'
    value_numeric DECIMAL(15, 6),
    value_text TEXT,
    value_boolean BOOLEAN,
    unit_of_measure VARCHAR(50),
    detection_limit DECIMAL(15, 6),
    quantitation_limit DECIMAL(15, 6),
    measurement_uncertainty DECIMAL(8, 4),
    test_method VARCHAR(255),
    test_equipment VARCHAR(255),
    reagent_batch VARCHAR(100),
    calibration_date DATE,
    quality_control_passed BOOLEAN,
    duplicate_analysis_available BOOLEAN,
    reference_standard_value DECIMAL(15, 6),
    reference_standard_lot VARCHAR(100),
    analyst_name VARCHAR(255),
    analysis_date TIMESTAMP WITH TIME ZONE,
    review_date TIMESTAMP WITH TIME ZONE,
    reviewer_name VARCHAR(255),
    approval_date TIMESTAMP WITH TIME ZONE,
    approver_name VARCHAR(255),
    validation_status VARCHAR(20) DEFAULT 'PRELIMINARY', -- 'PRELIMINARY', 'REVIEWED', 'APPROVED', 'REJECTED'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(sample_id, parameter_code)
);

CREATE INDEX idx_test_results_sample_id ON farm_management.test_results(sample_id);
CREATE INDEX idx_test_results_parameter_code ON farm_management.test_results(parameter_code);
CREATE INDEX idx_test_results_category ON farm_management.test_results(parameter_category);
CREATE INDEX idx_test_results_analysis_date ON farm_management.test_results(analysis_date);
CREATE INDEX idx_test_results_validation_status ON farm_management.test_results(validation_status);
```

## Tabelas de Histórico e Dados Dinâmicos

### 8. Solo (Soil Data)
```sql
CREATE TABLE farm_management.soil_data (
    soil_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sample_depth_cm DECIMAL(5, 2) NOT NULL,
    ph_water DECIMAL(4, 2),
    ph_kcl DECIMAL(4, 2),
    organic_matter_percent DECIMAL(5, 2),
    organic_carbon_percent DECIMAL(5, 2),
    nitrogen_total_percent DECIMAL(6, 3),
    phosphorus_available_ppm DECIMAL(8, 2),
    potassium_exchangeable_cmolc_kg DECIMAL(6, 3),
    calcium_exchangeable_cmolc_kg DECIMAL(6, 3),
    magnesium_exchangeable_cmolc_kg DECIMAL(6, 3),
    sodium_exchangeable_cmolc_kg DECIMAL(6, 3),
    aluminum_exchangeable_cmolc_kg DECIMAL(6, 3),
    iron_available_ppm DECIMAL(8, 2),
    manganese_available_ppm DECIMAL(8, 2),
    zinc_available_ppm DECIMAL(8, 2),
    copper_available_ppm DECIMAL(8, 2),
    boron_available_ppm DECIMAL(8, 2),
    sulfur_available_ppm DECIMAL(8, 2),
    base_saturation_percent DECIMAL(5, 2),
    aluminum_saturation_percent DECIMAL(5, 2),
    cec_cmolc_kg DECIMAL(8, 2),
    soil_texture_clay_percent DECIMAL(5, 2),
    soil_texture_silt_percent DECIMAL(5, 2),
    soil_texture_sand_percent DECIMAL(5, 2),
    bulk_density_g_cm3 DECIMAL(6, 3),
    particle_density_g_cm3 DECIMAL(6, 3),
    porosity_percent DECIMAL(5, 2),
    moisture_field_capacity_percent DECIMAL(5, 2),
    moisture_permanent_wilt_percent DECIMAL(5, 2),
    hydraulic_conductivity_cm_hr DECIMAL(8, 4),
    electrical Conductivity_dS_m DECIMAL(8, 4),
    calcium_carbonate_percent DECIMAL(5, 2),
    micronutrients_available JSONB,
    heavy_metals_available JSONB,
    microbe_count_cfu_g DECIMAL(12, 0),
    enzyme_activity JSONB,
    soil_health_index DECIMAL(5, 2),
    sustainability_score DECIMAL(5, 2),
    analysis_method VARCHAR(255),
    laboratory VARCHAR(255),
    test_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_soil_data_plot_id ON farm_management.soil_data(plot_id);
CREATE INDEX idx_soil_data_date ON farm_management.soil_data(analysis_date);
CREATE INDEX idx_soil_data_depth ON farm_management.soil_data(sample_depth_cm);
CREATE INDEX idx_soil_data_ph ON farm_management.soil_data(ph_water);
CREATE INDEX idx_soil_data_organic_matter ON farm_management.soil_data(organic_matter_percent);
CREATE INDEX idx_soil_data_nutrients ON farm_management.soil_data(phosphorus_available_ppm, potassium_exchangeable_cmolc_kg);
```

### 9. Clima (Climate Data)
```sql
CREATE TABLE farm_management.climate_data (
    climate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    timestamp_measured TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature_celsius DECIMAL(5, 2),
    humidity_percent DECIMAL(5, 2),
    rainfall_mm DECIMAL(8, 2),
    wind_speed_mps DECIMAL(5, 2),
    wind_direction_degrees INTEGER,
    solar_radiation_wm2 DECIMAL(8, 2),
    soil_temperature_celsius DECIMAL(5, 2),
    soil_moisture_percent DECIMAL(5, 2),
    atmospheric_pressure_hpa DECIMAL(8, 2),
    evapotranspiration_mm DECIMAL(8, 2),
    vapor_pressure_kpa DECIMAL(6, 3),
    leaf_wetness_percent DECIMAL(5, 2),
    uv_index DECIMAL(4, 1),
    data_source VARCHAR(100), -- 'MANUAL', 'AUTOMATED', 'REMOTE_SENSOR', 'WEATHER_STATION'
    sensor_id VARCHAR(100),
    quality_flag VARCHAR(20), -- 'GOOD', 'SUSPECT', 'POOR', 'MISSING'
    calibration_date DATE,
    maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_climate_data_plot_id ON farm_management.climate_data(plot_id);
CREATE INDEX idx_climate_data_timestamp ON farm_management.climate_data(timestamp_measured);
CREATE INDEX idx_climate_data_sensor ON farm_management.climate_data(sensor_id);
CREATE INDEX idx_climate_data_quality ON farm_management.climate_data(quality_flag);
```

### 10. Cultivos (Crops)
```sql
CREATE TABLE farm_management.crop_data (
    crop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    crop_season_id UUID,
    crop_name VARCHAR(255) NOT NULL,
    crop_variety VARCHAR(255),
    planting_date DATE NOT NULL,
    emergence_date DATE,
    flowering_date DATE,
    harvest_date DATE,
    crop_cycle_days INTEGER,
    area_planted_hectares DECIMAL(10, 4) NOT NULL,
    planting_density_plants_ha DECIMAL(10, 0),
    row_spacing_cm DECIMAL(6, 2),
    plant_spacing_cm DECIMAL(6, 2),
    seed_rate_kg_ha DECIMAL(8, 2),
    seed_variety VARCHAR(255),
    seed_treatment VARCHAR(255),
    irrigation_method VARCHAR(100),
    irrigation_schedule JSONB,
    fertilizer_program JSONB,
    pesticide_program JSONB,
    growth_stage VARCHAR(100),
    plant_height_cm DECIMAL(6, 2),
    leaf_area_index DECIMAL(6, 3),
    chlorophyll_reading DECIMAL(6, 2),
    ndvi_value DECIMAL(6, 4),
    expected_yield_ton_ha DECIMAL(8, 2),
    actual_yield_ton_ha DECIMAL(8, 2),
    yield_loss_percent DECIMAL(5, 2),
    crop_quality_grade VARCHAR(100),
    market_value_per_ton DECIMAL(10, 2),
    total_revenue DECIMAL(12, 2),
    production_costs DECIMAL(12, 2),
    profit_margin DECIMAL(8, 2),
    sustainability_score DECIMAL(5, 2),
    carbon_footprint_kg_co2e_ton DECIMAL(10, 2),
    water_usage_efficiency_kg_m3 DECIMAL(8, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_crop_data_plot_id ON farm_management.crop_data(plot_id);
CREATE INDEX idx_crop_data_season ON farm_management.crop_data(crop_season_id);
CREATE INDEX idx_crop_data_planting_date ON farm_management.crop_data(planting_date);
CREATE INDEX idx_crop_data_harvest_date ON farm_management.crop_data(harvest_date);
CREATE INDEX idx_crop_data_crop_name ON farm_management.crop_data(crop_name);
CREATE INDEX idx_crop_data_variety ON farm_management.crop_data(crop_variety);
CREATE INDEX idx_crop_data_yield ON farm_management.crop_data(actual_yield_ton_ha);
```

### 11. Rotação (Rotation)
```sql
CREATE TABLE farm_management.crop_rotation (
    rotation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    rotation_sequence INTEGER NOT NULL,
    rotation_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    crop_family VARCHAR(100), -- 'GRAMINEAE', 'LEGUMINOSAE', 'SOLANACEAE', 'CUCURBITACEAE', 'BRASSICACEAE', 'OTHER'
    previous_crop_name VARCHAR(255),
    next_crop_name VARCHAR(255),
    rotation_efficiency_score DECIMAL(5, 2),
    soil_health_improvement_score DECIMAL(5, 2),
    pest_disease_suppression_score DECIMAL(5, 2),
    nitrogen_fixation_contribution_kg_ha DECIMAL(8, 2),
    cover_crop_benefits TEXT,
    rotation_duration_years DECIMAL(4, 1),
    practices_applied JSONB,
    economic_analysis JSONB,
    sustainability_metrics JSONB,
    recommendation TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(plot_id, rotation_sequence)
);

CREATE INDEX idx_crop_rotation_plot_id ON farm_management.crop_rotation(plot_id);
CREATE INDEX idx_crop_rotation_sequence ON farm_management.crop_rotation(rotation_sequence);
CREATE INDEX idx_crop_rotation_family ON farm_management.crop_rotation(crop_family);
CREATE INDEX idx_crop_rotation_dates ON farm_management.crop_rotation(start_date, end_date);
```

### 12. Eventos Climáticos (Climate Events)
```sql
CREATE TABLE farm_management.climate_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES farm_management.field_plots(plot_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'DROUGHT', 'FLOOD', 'FROST', 'HAIL', 'WINDSTORM', 'HEATWAVE', 'COLDWAVE'
    event_name VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    duration_hours INTEGER,
    intensity_level VARCHAR(50), -- 'MILD', 'MODERATE', 'SEVERE', 'EXTREME'
    severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
    rainfall_amount_mm DECIMAL(8, 2),
    wind_speed_max_mps DECIMAL(6, 2),
    temperature_min_celsius DECIMAL(5, 2),
    temperature_max_celsius DECIMAL(5, 2),
    affected_area_hectares DECIMAL(10, 4),
    economic_damage_usd DECIMAL(12, 2),
    crop_damage_percent DECIMAL(5, 2),
    yield_impact_estimated_percent DECIMAL(5, 2),
    recovery_time_days INTEGER,
    mitigation_measures TEXT,
    lessons_learned TEXT,
    insurance_claim BOOLEAN DEFAULT FALSE,
    claim_amount DECIMAL(12, 2),
    data_source VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'PRELIMINARY', -- 'PRELIMINARY', 'VERIFIED', 'DISPUTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_climate_events_plot_id ON farm_management.climate_events(plot_id);
CREATE INDEX idx_climate_events_type ON farm_management.climate_events(event_type);
CREATE INDEX idx_climate_events_dates ON farm_management.climate_events(start_date, end_date);
CREATE INDEX idx_climate_events_severity ON farm_management.climate_events(severity_score);
CREATE INDEX idx_climate_events_intensity ON farm_management.climate_events(intensity_level);
```

## Funções e Triggers Úteis

### Função para Atualizar Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas as tabelas principais
CREATE TRIGGER update_farms_updated_at 
    BEFORE UPDATE ON farm_management.farms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_areas_updated_at 
    BEFORE UPDATE ON farm_management.farm_areas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_plots_updated_at 
    BEFORE UPDATE ON farm_management.field_plots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technical_visits_updated_at 
    BEFORE UPDATE ON farm_management.technical_visits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specific_analyses_updated_at 
    BEFORE UPDATE ON farm_management.specific_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_samples_updated_at 
    BEFORE UPDATE ON farm_management.samples 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_results_updated_at 
    BEFORE UPDATE ON farm_management.test_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soil_data_updated_at 
    BEFORE UPDATE ON farm_management.soil_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_climate_data_updated_at 
    BEFORE UPDATE ON farm_management.climate_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crop_data_updated_at 
    BEFORE UPDATE ON farm_management.crop_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crop_rotation_updated_at 
    BEFORE UPDATE ON farm_management.crop_rotation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_climate_events_updated_at 
    BEFORE UPDATE ON farm_management.climate_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Função para Calcular Métricas de Solo
```sql
CREATE OR REPLACE FUNCTION calculate_soil_health_metrics(
    p_plot_id UUID,
    p_analysis_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    ph_score INTEGER,
    organic_matter_score INTEGER,
    nutrient_score INTEGER,
    soil_health_index DECIMAL(5, 2),
    sustainability_score DECIMAL(5, 2)
) AS $$
DECLARE
    v_ph_water DECIMAL(4, 2);
    v_organic_matter DECIMAL(5, 2);
    v_phosphorus DECIMAL(8, 2);
    v_potassium DECIMAL(6, 3);
    v_calcium DECIMAL(6, 3);
    v_magnesium DECIMAL(6, 3);
    v_base_saturation DECIMAL(5, 2);
    v_ph_score INTEGER;
    v_om_score INTEGER;
    v_nutrient_score INTEGER;
    v_soil_health DECIMAL(5, 2);
    v_sustainability DECIMAL(5, 2);
BEGIN
    -- Buscar os dados mais recentes de solo para o talhão
    SELECT 
        ph_water, organic_matter_percent, phosphorus_available_ppm,
        potassium_exchangeable_cmolc_kg, calcium_exchangeable_cmolc_kg,
        magnesium_exchangeable_cmolc_kg, base_saturation_percent
    INTO 
        v_ph_water, v_organic_matter, v_phosphorus, v_potassium,
        v_calcium, v_magnesium, v_base_saturation
    FROM farm_management.soil_data
    WHERE plot_id = p_plot_id 
    AND analysis_date <= p_analysis_date
    ORDER BY analysis_date DESC
    LIMIT 1;
    
    -- Calcular scores (simplificado para exemplo)
    v_ph_score := CASE 
        WHEN v_ph_water BETWEEN 6.0 AND 7.5 THEN 10
        WHEN v_ph_water BETWEEN 5.5 AND 6.0 THEN 8
        WHEN v_ph_water BETWEEN 7.5 AND 8.0 THEN 8
        ELSE 5
    END;
    
    v_om_score := CASE 
        WHEN v_organic_matter >= 4.0 THEN 10
        WHEN v_organic_matter >= 3.0 THEN 8
        WHEN v_organic_matter >= 2.0 THEN 6
        WHEN v_organic_matter >= 1.0 THEN 4
        ELSE 2
    END;
    
    v_nutrient_score := CASE 
        WHEN v_phosphorus >= 15 AND v_potassium >= 1.5 AND v_calcium >= 5.0 THEN 10
        WHEN v_phosphorus >= 10 AND v_potassium >= 1.0 AND v_calcium >= 3.0 THEN 8
        WHEN v_phosphorus >= 5 AND v_potassium >= 0.5 AND v_calcium >= 2.0 THEN 6
        ELSE 4
    END;
    
    v_soil_health := (v_ph_score + v_om_score + v_nutrient_score) / 3;
    
    v_sustainability := CASE 
        WHEN v_base_saturation >= 80 THEN v_soil_health
        WHEN v_base_saturation >= 60 THEN v_soil_health * 0.9
        WHEN v_base_saturation >= 40 THEN v_soil_health * 0.8
        ELSE v_soil_health * 0.7
    END;
    
    RETURN QUERY SELECT v_ph_score, v_om_score, v_nutrient_score, v_soil_health, v_sustainability;
END;
$$ LANGUAGE plpgsql;
```

### Views Úteis para Análises
```sql
-- View para Dashboard de Saúde do Solo
CREATE VIEW farm_management.v_soil_health_summary AS
SELECT 
    fp.plot_id,
    fp.plot_code,
    fp.plot_name,
    fa.area_name,
    f.farm_name,
    sd.analysis_date,
    sd.ph_water,
    sd.organic_matter_percent,
    sd.phosphorus_available_ppm,
    sd.potassium_exchangeable_cmolc_kg,
    sd.base_saturation_percent,
    sd.soil_health_index,
    sd.sustainability_score
FROM farm_management.field_plots fp
JOIN farm_management.farm_areas fa ON fp.area_id = fa.area_id
JOIN farm_management.farms f ON fa.farm_id = f.farm_id
CROSS JOIN LATERAL (
    SELECT *
    FROM farm_management.soil_data ssd
    WHERE ssd.plot_id = fp.plot_id
    ORDER BY ssd.analysis_date DESC
    LIMIT 1
) sd
WHERE fp.status = 'A' AND fa.status = 'A' AND f.status = 'A';

-- View para Análise de Produtividade
CREATE VIEW farm_management.v_productivity_analysis AS
SELECT 
    fp.plot_id,
    fp.plot_code,
    fp.plot_name,
    fa.area_name,
    f.farm_name,
    cd.crop_name,
    cd.variety,
    cd.planting_date,
    cd.harvest_date,
    cd.expected_yield_ton_ha,
    cd.actual_yield_ton_ha,
    cd.yield_loss_percent,
    cd.profit_margin,
    cd.total_revenue,
    cd.production_costs,
    cd.sustainability_score,
    ROUND((cd.actual_yield_ton_ha / cd.expected_yield_ton_ha * 100), 2) as yield_efficiency_percent
FROM farm_management.field_plots fp
JOIN farm_management.farm_areas fa ON fp.area_id = fa.area_id
JOIN farm_management.farms f ON fa.farm_id = f.farm_id
JOIN farm_management.crop_data cd ON fp.plot_id = cd.plot_id
WHERE fp.status = 'A' AND fa.status = 'A' AND f.status = 'A';

-- View para Monitoramento Climático
CREATE VIEW farm_management.v_climate_monitoring AS
SELECT 
    fp.plot_id,
    fp.plot_code,
    fp.plot_name,
    fa.area_name,
    f.farm_name,
    cd.timestamp_measured,
    cd.temperature_celsius,
    cd.humidity_percent,
    cd.rainfall_mm,
    cd.soil_temperature_celsius,
    cd.soil_moisture_percent,
    cd.evapotranspiration_mm,
    CASE 
        WHEN cd.rainfall_mm > 25 THEN 'Heavy Rain'
        WHEN cd.rainfall_mm > 10 THEN 'Moderate Rain'
        WHEN cd.rainfall_mm > 2 THEN 'Light Rain'
        ELSE 'No Rain'
    END as rainfall_intensity,
    CASE 
        WHEN cd.temperature_celsius > 35 THEN 'Heat Stress'
        WHEN cd.temperature_celsius < 5 THEN 'Cold Stress'
        WHEN cd.temperature_celsius BETWEEN 20 AND 30 THEN 'Optimal'
        ELSE 'Suboptimal'
    END as temperature_status
FROM farm_management.field_plots fp
JOIN farm_management.farm_areas fa ON fp.area_id = fa.area_id
JOIN farm_management.farms f ON fa.farm_id = f.farm_id
JOIN farm_management.climate_data cd ON fp.plot_id = cd.plot_id
WHERE fp.status = 'A' AND fa.status = 'A' AND f.status = 'A'
  AND cd.timestamp_measured >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY cd.timestamp_measured DESC;
```

## Configuração de Particionamento para Dados Temporais

### Particionamento por Mês para Dados Climáticos
```sql
-- Criar tabela particionada para dados climáticos
CREATE TABLE farm_management.climate_data_partitioned (
    LIKE farm_management.climate_data INCLUDING ALL
) PARTITION BY RANGE (timestamp_measured);

-- Criar partições para os próximos 24 meses
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
    i INTEGER;
BEGIN
    FOR i IN 0..23 LOOP
        end_date := start_date + (i + 1) * INTERVAL '1 month';
        partition_name := 'climate_data_' || TO_CHAR(start_date + i * INTERVAL '1 month', 'YYYY_MM');
        
        EXECUTE format('
            CREATE TABLE farm_management.%I 
            PARTITION OF farm_management.climate_data_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date + i * INTERVAL '1 month', end_date
        );
    END LOOP;
END $$;

-- Índices nas partições
CREATE INDEX idx_climate_data_partitioned_plot_id ON farm_management.climate_data_partitioned(plot_id);
CREATE INDEX idx_climate_data_partitioned_timestamp ON farm_management.climate_data_partitioned(timestamp_measured);
```

## Políticas de Retenção e Arquivamento

### Políticas de Retenção Automática
```sql
-- Função para arquivar dados antigos
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS VOID AS $$
DECLARE
    cutoff_date DATE := CURRENT_DATE - INTERVAL '5 years';
BEGIN
    -- Arquivar dados de solo antigos (> 5 anos)
    INSERT INTO farm_management.archive_soil_data
    SELECT * FROM farm_management.soil_data 
    WHERE analysis_date < cutoff_date;
    
    DELETE FROM farm_management.soil_data 
    WHERE analysis_date < cutoff_date;
    
    -- Arquivar dados climáticos antigos (> 3 anos)
    INSERT INTO farm_management.archive_climate_data
    SELECT * FROM farm_management.climate_data 
    WHERE timestamp_measured < (CURRENT_DATE - INTERVAL '3 years');
    
    DELETE FROM farm_management.climate_data 
    WHERE timestamp_measured < (CURRENT_DATE - INTERVAL '3 years');
    
    -- Arquivar visitas técnicas antigas (> 7 anos)
    INSERT INTO farm_management.archive_technical_visits
    SELECT * FROM farm_management.technical_visits 
    WHERE visit_date < (CURRENT_DATE - INTERVAL '7 years');
    
    DELETE FROM farm_management.technical_visits 
    WHERE visit_date < (CURRENT_DATE - INTERVAL '7 years');
END;
$$ LANGUAGE plpgsql;

-- Agendar execução mensal (requer extensão pg_cron)
-- SELECT cron.schedule('archive-old-data', '0 2 1 * *', 'SELECT archive_old_data();');
```

## Índices para Performance de Consultas

### Índices Compostos para Consultas Comuns
```sql
-- Índices para consultas hierárquicas
CREATE INDEX idx_field_plots_farm_area ON farm_management.field_plots(farm_id, area_id);
CREATE INDEX idx_visits_plot_date ON farm_management.technical_visits(plot_id, visit_date);
CREATE INDEX idx_analyses_plot_type_date ON farm_management.specific_analyses(plot_id, analysis_type, analysis_date);
CREATE INDEX idx_samples_analysis_date ON farm_management.samples(analysis_id, sample_date);
CREATE INDEX idx_results_sample_param ON farm_management.test_results(sample_id, parameter_code);

-- Índices para consultas analíticas
CREATE INDEX idx_soil_data_plot_date ON farm_management.soil_data(plot_id, analysis_date DESC);
CREATE INDEX idx_crop_data_plot_planting ON farm_management.crop_data(plot_id, planting_date);
CREATE INDEX idx_climate_data_plot_timestamp ON farm_management.climate_data(plot_id, timestamp_measured DESC);

-- Índices parciais para dados ativos
CREATE INDEX idx_technical_visits_active ON farm_management.technical_visits(visit_date) WHERE status = 'COMPLETED';
CREATE INDEX idx_soil_data_recent ON farm_management.soil_data(plot_id, analysis_date) WHERE analysis_date > CURRENT_DATE - INTERVAL '2 years';
CREATE INDEX idx_test_results_validated ON farm_management.test_results(parameter_code, analysis_date) WHERE validation_status = 'APPROVED';

-- Índices para full-text search
CREATE INDEX idx_field_plots_search ON farm_management.field_plots USING GIN(
    to_tsvector('portuguese', plot_name || ' ' || COALESCE(plot_description, ''))
);
CREATE INDEX idx_soil_data_parameters ON farm_management.soil_data USING GIN(
    to_jsonb(ARRAY[
        'ph_water', 'organic_matter_percent', 'phosphorus_available_ppm'
    ])
);
```

Este schema SQL fornece uma base sólida para implementação do sistema hierárquico de dados agrícolas, com foco em performance, escalabilidade e análise de dados históricos conforme definido no documento principal de design.