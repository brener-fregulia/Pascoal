program multiple_inputs;

uses SysUtils;

var
  name: string;
  age: integer;
  height: real;

begin
  writeln('Name:');
  readln(name);
  writeln('Age:');
  readln(age);
  writeln('Height:');
  readln(height);
  writeln('Hello, ', name, '!');
  writeln('Age: ', age);
  writeln('Height: ', height:0:2);
end.
