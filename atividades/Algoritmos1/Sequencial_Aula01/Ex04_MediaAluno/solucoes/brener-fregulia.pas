program MediaAluno;
var
  nota1, nota2, nota3, media: Real;
begin
  writeln('Digite a primeira nota:');
  readln(nota1);
  writeln('Digite a segunda nota:');
  readln(nota2);
  writeln('Digite a terceira nota:');
  readln(nota3);
  media := (nota1 + nota2 + nota3) / 3;
  writeln('A media do aluno e: ', media:0:2);
end.
