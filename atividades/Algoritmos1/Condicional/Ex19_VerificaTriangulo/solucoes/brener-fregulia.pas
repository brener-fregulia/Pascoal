program VerificaTriangulo;
var
  ladoA, ladoB, ladoC: Integer;
  semiPerimetro, area: Real;
begin
  writeln('Digite os tres lados do triangulo:');
  readln(ladoA, ladoB, ladoC);
  if (ladoA + ladoB > ladoC) and (ladoA + ladoC > ladoB) and (ladoB + ladoC > ladoA) then
  begin
    semiPerimetro := (ladoA + ladoB + ladoC) / 2;
    area := sqrt(semiPerimetro * (semiPerimetro - ladoA) * (semiPerimetro - ladoB) * (semiPerimetro - ladoC));
    writeln('Forma um triangulo.');
    writeln('Area do triangulo: ', area:0:2);
  end
  else
  begin
    writeln('Nao forma um triangulo.');
    writeln('Lados informados: ', ladoA, ', ', ladoB, ', ', ladoC);
  end;
end.
