program SalarioHypotheticus;
const
  valorHora: Real = 10;
  valorHoraExtra: Real = 15;
  percDesconto: Real = 0.1;
var
  horas, horasExtras, salario: Real;
begin
  writeln('Digite o numero de horas trabalhadas (sem horas extras):');
  readln(horas);
  writeln('Digite o numero de horas extras trabalhadas:');
  readln(horasExtras);
  salario := (valorHora * horas) + (valorHoraExtra * horasExtras);
  writeln('Salario bruto: R$ ', salario:0:2);
  writeln('Salario liquido: R$ ', (salario - salario * percDesconto):0:2);
end.
