program CalculoSalario;
const
  percAumento: Real = 15;
  percDesconto: Real = 8;
var
  salario, salarioComAumento: Real;
begin
  writeln('Digite o salario inicial:');
  readln(salario);
  salarioComAumento := salario + salario * percAumento / 100;
  writeln('Salario inicial: R$ ', salario:0:2);
  writeln('Salario com aumento de ', percAumento:0:0, '%%: R$ ', salarioComAumento:0:2);
  writeln('Salario apos desconto de impostos: R$ ', (salarioComAumento - salarioComAumento * percDesconto / 100):0:2);
end.
