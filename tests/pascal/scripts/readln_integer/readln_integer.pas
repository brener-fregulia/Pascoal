program readln_integer;

uses SysUtils;

var
  x: integer;

begin
  writeln('Type a number:');
  readln(x);
  writeln('Number: ', x);
  writeln('Text: ', IntToStr(x));
end.
