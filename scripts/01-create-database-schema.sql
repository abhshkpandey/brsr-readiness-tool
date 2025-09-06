-- BRSR Assessment Tool Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(20) CHECK (company_size IN ('small', 'medium', 'large', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'BRSR Assessment',
    reporting_period VARCHAR(50) DEFAULT 'FY 2024-25',
    status VARCHAR(20) CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted')) DEFAULT 'draft',
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Assessment responses table
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    section_key VARCHAR(50) NOT NULL,
    response_value TEXT,
    response_type VARCHAR(20) CHECK (response_type IN ('number', 'text', 'boolean')) NOT NULL,
    unit VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, question_id)
);

-- Section scores table
CREATE TABLE section_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    section_key VARCHAR(50) NOT NULL,
    section_title VARCHAR(255) NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    completed_questions INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, section_key)
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    report_type VARCHAR(20) CHECK (report_type IN ('pdf', 'excel', 'json')) DEFAULT 'pdf',
    file_path VARCHAR(500),
    file_size INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_section_key ON assessment_responses(section_key);
CREATE INDEX idx_section_scores_assessment_id ON section_scores(assessment_id);
CREATE INDEX idx_reports_assessment_id ON reports(assessment_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_responses_updated_at BEFORE UPDATE ON assessment_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_section_scores_updated_at BEFORE UPDATE ON section_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
