program Hipotenusa;
var
  cateto1, cateto2, hipotenusa: Real;
begin
  writeln('Digite o valor do primeiro cateto:');
  readln(cateto1);
  writeln('Digite o valor do segundo cateto:');
  readln(cateto2);
  hipotenusa := sqrt((cateto1 * cateto1) + (cateto2 * cateto2));
  writeln('O valor da hipotenusa e: ', hipotenusa:0:2);
end.
