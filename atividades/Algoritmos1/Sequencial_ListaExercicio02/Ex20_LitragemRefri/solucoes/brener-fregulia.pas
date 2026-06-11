program LitragemRefri;
const
  volLata: Real = 0.35;
  volGarrafaMedia: Real = 0.6;
  volGarrafaGrande: Real = 2;
var
  qtdLata, qtdGarrafaMedia, qtdGarrafaGrande: Integer;
  totalLitros: Real;
begin
  writeln('Digite a quantidade de latas (350ml) compradas:');
  readln(qtdLata);
  writeln('Digite a quantidade de garrafas (600ml) compradas:');
  readln(qtdGarrafaMedia);
  writeln('Digite a quantidade de garrafas (2L) compradas:');
  readln(qtdGarrafaGrande);
  totalLitros := (qtdLata * volLata) + (qtdGarrafaMedia * volGarrafaMedia) + (qtdGarrafaGrande * volGarrafaGrande);
  writeln('Foram comprados ', totalLitros:0:3, ' litros de refrigerante.');
end.
