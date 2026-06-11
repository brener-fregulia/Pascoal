program QtdeSalariosMinimos;
var
  salarioMinimo, salarioFuncionario: Real;
begin
  writeln('Digite o valor do salario minimo:');
  readln(salarioMinimo);
  writeln('Digite o valor do salario do funcionario:');
  readln(salarioFuncionario);
  writeln('O funcionario ganha ', (salarioFuncionario / salarioMinimo):0:2, ' salarios minimos.');
end.
