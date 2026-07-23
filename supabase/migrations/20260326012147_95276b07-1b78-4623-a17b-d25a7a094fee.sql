-- Move recebimentos from duplicate OS-11 conta to original
UPDATE recebimentos_parciais 
SET conta_receber_id = '219d6f24-0275-46f3-b45e-dca0a8e91dd4'
WHERE conta_receber_id = 'bd0235d1-8ac3-4204-847c-5f50588e484c';

-- Delete the duplicate conta_receber
DELETE FROM contas_receber WHERE id = 'bd0235d1-8ac3-4204-847c-5f50588e484c';

-- Update the original conta status - total received is now 200+190+810+1680+520 = 3400 of 4200
-- Still parcial since 3400 < 4200