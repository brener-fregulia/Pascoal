program Restaurante;
var
  peso, valor: Real;
begin
  writeln('Digite em quilos quanto pesou o prato (Ex: Se foi 659 gramas digite "0.659"):');
  readln(peso);
  valor := (peso - 0.150) * 12;
  writeln('A refeicao custou ', valor:0:2, ' reais.');
end.
