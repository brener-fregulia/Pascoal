program MediaPonderada;
const
  peso1: Real = 1;
  peso2: Real = 2;
  peso3: Real = 3;
var
  nota1, nota2, nota3, mediaPonderada: Real;
begin
  writeln('Digite a 1 nota (Peso ', peso1:0:0, '):');
  readln(nota1);
  writeln('Digite a 2 nota (Peso ', peso2:0:0, '):');
  readln(nota2);
  writeln('Digite a 3 nota (Peso ', peso3:0:0, '):');
  readln(nota3);
  mediaPonderada := (nota1 * peso1 + nota2 * peso2 + nota3 * peso3) / (peso1 + peso2 + peso3);
  writeln('A media ponderada e: ', mediaPonderada:0:2);
end.
