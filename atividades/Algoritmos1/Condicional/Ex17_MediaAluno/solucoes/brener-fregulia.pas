program MediaAluno;
var
  idAluno: Integer;
  nota1, nota2, nota3, mediaExercicios, mediaAproveitamento: Real;
  conceito: Char;
begin
  write('Informe o numero de identificacao do aluno: ');
  readln(idAluno);
  write('Informe a Nota 1: ');
  readln(nota1);
  write('Informe a Nota 2: ');
  readln(nota2);
  write('Informe a Nota 3: ');
  readln(nota3);
  write('Informe a media dos exercicios: ');
  readln(mediaExercicios);
  mediaAproveitamento := (nota1 + nota2 * 2 + nota3 * 3 + mediaExercicios) / 7;
  if mediaAproveitamento >= 90 then
    conceito := 'A'
  else if mediaAproveitamento >= 75 then
    conceito := 'B'
  else if mediaAproveitamento >= 60 then
    conceito := 'C'
  else if mediaAproveitamento >= 40 then
    conceito := 'D'
  else
    conceito := 'E';
  writeln;
  writeln('Numero do aluno: ', idAluno);
  writeln('Notas: ', nota1:0:2, ', ', nota2:0:2, ', ', nota3:0:2);
  writeln('Media dos exercicios: ', mediaExercicios:0:2);
  writeln('Media de aproveitamento: ', mediaAproveitamento:0:2);
  writeln('Conceito: ', conceito);
  if conceito in ['A', 'B', 'C'] then
    writeln('Aprovado')
  else
    writeln('Reprovado');
end.
