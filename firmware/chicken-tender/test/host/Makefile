# Host tests for the Chicken Tender coop controller math (no ESP32 toolchain needed).
CXX ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -Werror -O1

test: test_mq137
	./test_mq137

test_mq137: test_mq137.cpp ../../lib/mq137/mq137.h
	$(CXX) $(CXXFLAGS) -o $@ test_mq137.cpp -lm

clean:
	rm -f test_mq137
.PHONY: test clean
