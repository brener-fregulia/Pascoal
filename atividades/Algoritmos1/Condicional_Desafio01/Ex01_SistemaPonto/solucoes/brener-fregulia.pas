program SistemaPonto;
var
  horaEntrada, minutoEntrada, horaSaida, minutoSaida: Integer;
  totalMinEntrada, totalMinSaida, totalMinutos, tempoHoras, tempoMinutos: Integer;
begin
  writeln('Digite apenas a hora de entrada (Ex: 13):');
  readln(horaEntrada);
  writeln('Digite os minutos de entrada (Ex: 25):');
  readln(minutoEntrada);
  writeln('Digite apenas a hora de saida (Ex: 17):');
  readln(horaSaida);
  writeln('Digite os minutos de saida (Ex: 30):');
  readln(minutoSaida);
  totalMinEntrada := (horaEntrada * 60) + minutoEntrada;
  totalMinSaida := (horaSaida * 60) + minutoSaida;
  totalMinutos := totalMinSaida - totalMinEntrada;
  tempoHoras := totalMinutos div 60;
  tempoMinutos := totalMinutos mod 60;
  writeln('O funcionario ficou ', tempoHoras, ' hora(s) e ', tempoMinutos, ' minuto(s) na empresa.');
end.
