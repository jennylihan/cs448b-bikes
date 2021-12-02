#!/usr/bin/python

# Open a file
fo = open("counts.csv", "wb")

lista = [67, 40, 32, 39, 34, 37, 28, 28, 24, 48, 66, 84, 67, 48, 59, 78]
for i in range(len(lista)):
    for time in range(lista[i]):
        fo.write(str(i+1) + "\n")

# Close opend file
fo.close()
