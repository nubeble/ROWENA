#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n com.nubeble.rowena/host.exp.exponent.MainActivity
