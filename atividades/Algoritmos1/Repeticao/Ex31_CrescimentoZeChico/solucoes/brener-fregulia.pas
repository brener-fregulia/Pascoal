program CrescimentoZeChico;
var
  alturaChico, alturaZe: Real;
  anos: Integer;
begin
  alturaChico := 1.50;
  alturaZe := 1.10;
  anos := 0;
  while alturaZe <= alturaChico do
  begin
    alturaChico := alturaChico + 0.02;
    alturaZe := alturaZe + 0.03;
    anos := anos + 1;
  end;
  writeln('Serao necessarios ', anos, ' anos para que Ze seja maior que Chico.');
end.
