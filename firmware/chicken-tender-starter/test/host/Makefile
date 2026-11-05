# Host tests for the door logic. CI uses the runner's g++; any C++17 compiler works:
#   make -C firmware/chicken-tender-starter/test/host CXX="zig c++ -mcpu=baseline"
# (zig without -mcpu=baseline targets the build CPU exactly; some VMs then hit SIGILL)
CXX ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -Werror -O1
SRC = test_door_logic.cpp ../../lib/door_logic/door_logic.cpp

all: run

test_door_logic: $(SRC) ../../lib/door_logic/door_logic.h
	$(CXX) $(CXXFLAGS) -I../../lib/door_logic -o $@ $(SRC)

run: test_door_logic
	./test_door_logic

clean:
	rm -f test_door_logic

.PHONY: all run clean
