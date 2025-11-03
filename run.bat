@echo off
set CP=.;pdfbox-app-3.0.6.jar;tess4j-5.9.0.jar;lept4j-1.18.0.jar;jai-imageio-core-1.4.0.jar;jna-5.13.0.jar;jna-platform-5.13.0.jar;commons-io-2.11.0.jar;slf4j-api-2.0.9.jar;logback-classic-1.4.11.jar;logback-core-1.4.11.jar

java -cp "%CP%" PDFParserUnified %*