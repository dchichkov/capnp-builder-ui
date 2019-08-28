@0xdc66efca03ed01e2;

struct Header {
  messageNumber @0 :UInt64;
}

struct TestField {
  test @0 :Text;
}

struct TestStruct {
  int64Field  @0 :UInt64;
  int32Field  @1 :UInt32;
  blobField   @2 :Data;
  stringField @3 :Text;
  listField   @4 :List(TestField);

  enum Number {
    zero @0;
    one @1;
    two @2;
  }

  someUnion :union {
    voidField @5 :Void;
    textField @6 :Text;
    enumField @7 :Number; 
  }
}

struct Message {
  union {
    test  @0 : TestStruct;
    tests @1 : List(TestStruct); 
  }
}

struct Serialization {
  header @0 : Header;
  message @1 : Message;
}

