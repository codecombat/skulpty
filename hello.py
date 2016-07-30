class ParentClass:
  def f(self):
    return 'hello world'
  def __init__(self):
  	print "Bad"

class MyClass(ParentClass):
    
  def __init__(self):
  	print "Good"

x = MyClass('test')
x.f()