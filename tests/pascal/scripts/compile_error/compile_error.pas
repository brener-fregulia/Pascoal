program compile_error;

var
  x: integer;

begin
  { Intentional type error: cannot format integer with real specifier }
  writeln(x:0:2);
end.
