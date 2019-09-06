@0xdc66efca03ed01e2;

struct Header {
  messageNumber @0 :UInt64;
}

struct TestField {
  test @0 :Text;
}

enum Color {
  kBlack @0;
  kBlue @1;
  kGreen @2;
  kCyan @3;
  kRed @4;
  kMagenta @5;
  kBrown @6;
  kWhite @7;
  kGray @8;
  kLightBlue @9;
  kLightGreen @10;
  kLightCyan @11;
  kLightRed @12;
  kLightMagenta @13;
  kYellow @14;
  kBrightWhite @15;
}

enum Number {
  zero @0;
  one @1;
  two @2;
}


struct TestStruct {
  color @0 :Color;
  specialColorId  @1 :UInt64;
  regularColorId  @2 :UInt32;
  colorData @3 :Data;
  colorName @4 :Text;
  colors @5 :List(Color);
  colorDescriptions @6 :List(TestField);

  someUnion :union {
    emptiness @7 :Void;
    readMe @8 :Text;
    countMe @9 :Number; 
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

