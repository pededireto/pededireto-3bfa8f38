
-- 1. Expand commercial_status_tipo enum with new pipeline phases
ALTER TYPE commercial_status_tipo ADD VALUE IF NOT EXISTS 'proposta_enviada';
ALTER TYPE commercial_status_tipo ADD VALUE IF NOT EXISTS 'negociacao';
ALTER TYPE commercial_status_tipo ADD VALUE IF NOT EXISTS 'followup_agendado';
