program AlturaEdificio;
var
  lajeX, lajeY, altura: Real;
begin
  writeln('Digite a altura da laje x:');
  readln(lajeX);
  writeln('Digite a altura da laje y:');
  readln(lajeY);
  altura := (lajeX * 3) + (lajeY * 12);
  writeln('A altura do edificio e de ', altura:0:2, ' metros.');
end.
