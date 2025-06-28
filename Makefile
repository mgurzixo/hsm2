# hsm2 makefile

HSM_VERSION=0.8.68

PROGRAMS=
# .PHONY: all
# all: $(PROGRAMS)

develectron:
	quasar dev -m electron

buildelectron:
	quasar build -m electron

devios:
	quasar dev -m capacitor -T ios --ide

buildios:
	- rm -r ./src-capacitor/www
	quasar build -m capacitor -T ios --ide

clean :
	rm -f *.o 
