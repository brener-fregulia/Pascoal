program SomaFracional;
var
  numerador, denominador: Integer;
  soma: Real;
begin
  numerador := 1;
  denominador := 20;
  soma := 0;
  while (numerador <= 20) and (denominador >= 1) do
  begin
    writeln(soma:0:4, ' + ', numerador, '/', denominador, ' = ', (soma + numerador / denominador):0:4);
    soma := soma + numerador / denominador;
    inc(numerador);
    dec(denominador);
  end;
  writeln('Soma total: ', soma:0:4);
end.
