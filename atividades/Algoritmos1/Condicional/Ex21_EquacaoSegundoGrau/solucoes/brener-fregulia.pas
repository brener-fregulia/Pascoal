program EquacaoSegundoGrau;
var
  a, b, c, delta, x1, x2: Real;
begin
  write('Informe o valor de a: ');
  readln(a);
  write('Informe o valor de b: ');
  readln(b);
  write('Informe o valor de c: ');
  readln(c);
  if a = 0 then
    writeln('Nao e uma equacao do segundo grau.')
  else
  begin
    delta := b * b - 4 * a * c;
    if delta < 0 then
      writeln('A equacao nao possui raizes reais.')
    else if delta = 0 then
    begin
      x1 := -b / (2 * a);
      writeln('A equacao possui uma raiz real: ', x1:0:2);
    end
    else
    begin
      x1 := (-b + sqrt(delta)) / (2 * a);
      x2 := (-b - sqrt(delta)) / (2 * a);
      writeln('A equacao possui duas raizes reais:');
      writeln('x1 = ', x1:0:2);
      writeln('x2 = ', x2:0:2);
    end;
  end;
end.
