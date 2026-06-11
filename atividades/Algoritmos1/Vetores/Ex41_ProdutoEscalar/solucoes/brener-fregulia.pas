program ProdutoEscalar;
const
  n = 10;
var
  x, y: array[1..n] of Integer;
  i, produto: Integer;
begin
  writeln('Digite os valores do vetor x:');
  for i := 1 to n do
  begin
    write('x[', i, ']: ');
    readln(x[i]);
  end;
  writeln('Digite os valores do vetor y:');
  for i := 1 to n do
  begin
    write('y[', i, ']: ');
    readln(y[i]);
  end;
  produto := 0;
  for i := 1 to n do
    produto := produto + (x[i] * y[i]);
  writeln('O produto escalar dos vetores e: ', produto);
end.
