program CelsiusParaFahrenheit;
var
  tempC, tempF: Real;
begin
  writeln('Digite uma temperatura em Celsius:');
  readln(tempC);
  tempF := (tempC * 1.8) + 32;
  writeln('A temperatura ', tempC:0:2, ' em Celsius equivale a ', tempF:0:2, ' em Fahrenheit.');
end.
