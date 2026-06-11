program RestoSalarioJoao;
var
  salario, conta1, conta2, multa1, multa2, totalContas, restante: Real;
begin
  salario := 1200.00;
  conta1 := 200.00;
  conta2 := 120.00;
  multa1 := conta1 * 0.02;
  multa2 := conta2 * 0.02;
  totalContas := conta1 + multa1 + conta2 + multa2;
  restante := salario - totalContas;
  writeln('Salario de Joao: R$ ', salario:0:2);
  writeln('Total das contas com multas: R$ ', totalContas:0:2);
  writeln('Valor restante do salario: R$ ', restante:0:2);
end.
