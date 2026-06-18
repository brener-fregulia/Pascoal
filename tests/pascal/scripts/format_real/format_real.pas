program format_real;

var
  x: real;

begin
  writeln('Type a real number:');
  readln(x);
  writeln('Raw: ', x);
  writeln('Formatted: ', x:8:2);
  writeln('Compact: ', x:0:2);
end.
