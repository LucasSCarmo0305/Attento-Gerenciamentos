const diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const rotulosDias = { SEG:'Segunda-feira', TER:'Terça-feira', QUA:'Quarta-feira', QUI:'Quinta-feira', SEX:'Sexta-feira', SAB:'Sábado' };
const turnos = ['M', 'T', 'N'];
const rotulosTurno = { M:'Manhã', T:'Tarde', N:'Noite' };
const horariosTurno = { M:'08-13h', T:'14-17h', N:'18-21h' };
const horasExtra = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function criarSlot(status, profissional){
  return { status, profissional: profissional || null };
}

function criarSlotLivre(){ 
  return criarSlot('livre', null); 
}


