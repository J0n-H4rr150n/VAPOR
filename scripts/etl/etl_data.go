package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

// Configuration
const (
	inputFile       = "/mnt/data_drive/kaggle/lending_club/accepted_2007_to_2018Q4.csv" // Update this to your actual input file path
	outputDirectory = "/mnt/data_drive/kaggle/lending_club/by_year_go/"                // Update this to your desired output directory
	issueDateColumn = "issue_d"                                                       // Name of the column with the issue date
)

func main() {
	// Create the output directory if it doesn't exist
	if err := os.MkdirAll(outputDirectory, os.ModePerm); err != nil {
		log.Fatalf("Failed to create output directory %s: %v", outputDirectory, err)
	}

	// Open the input CSV file
	file, err := os.Open(inputFile)
	if err != nil {
		log.Fatalf("Failed to open input CSV file %s: %v", inputFile, err)
	}
	defer file.Close()

	reader := csv.NewReader(bufio.NewReader(file))
	reader.LazyQuotes = true // Important for some large CSVs with varying quote styles

	// Read the header row
	header, err := reader.Read()
	if err != nil {
		log.Fatalf("Failed to read header row: %v", err)
	}

	// Find the index of the issue_d column
	issueDateIndex := -1
	for i, colName := range header {
		if colName == issueDateColumn {
			issueDateIndex = i
			break
		}
	}

	if issueDateIndex == -1 {
		log.Fatalf("Column '%s' not found in header: %v", issueDateColumn, header)
	}

	// Keep track of writers for each year's file
	yearWriters := make(map[string]*csv.Writer)
	yearFiles := make(map[string]*os.File) // To close files later

	log.Println("Starting to process CSV...")
	rowCount := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break // End of file
		}
		if err != nil {
			// Handle CSV parsing errors, e.g., wrong number of fields
			log.Printf("Error reading record: %v - Skipping record: %v", err, record)
			continue
		}

		rowCount++
		if rowCount%100000 == 0 { // Log progress every 100,000 rows
			log.Printf("Processed %d rows...", rowCount)
		}

		issueDateStr := record[issueDateIndex]
		if issueDateStr == "" {
			log.Printf("Skipping record with empty issue date: %v", record)
			continue
		}

		// Parse the date string like "Dec-2015"
		// Go's reference time is Mon Jan 2 15:04:05 MST 2006
		parsedDate, err := time.Parse("Jan-2006", issueDateStr)
		if err != nil {
			log.Printf("Failed to parse date '%s': %v - Skipping record: %v", issueDateStr, err, record)
			continue
		}
		year := parsedDate.Year()
		yearStr := fmt.Sprintf("%d", year)

		// Get or create the writer for this year
		writer, exists := yearWriters[yearStr]
		if !exists {
			fileName := filepath.Join(outputDirectory, fmt.Sprintf("accepted_%s.csv", yearStr))
			f, err := os.Create(fileName)
			if err != nil {
				log.Printf("Failed to create output file %s: %v - Skipping year %s", fileName, err, yearStr)
				continue // Skip this year if file creation fails
			}
			yearFiles[yearStr] = f // Store for closing later
			writer = csv.NewWriter(bufio.NewWriter(f))
			yearWriters[yearStr] = writer

			// Write the header to the new year file
			if err := writer.Write(header); err != nil {
				log.Printf("Failed to write header to %s: %v", fileName, err)
				// Attempt to close and remove the problematic file
				f.Close()
				os.Remove(fileName)
				delete(yearWriters, yearStr)
				delete(yearFiles, yearStr)
				continue
			}
			log.Printf("Created and wrote header to %s", fileName)
		}

		// Write the current record to the appropriate year file
		if err := writer.Write(record); err != nil {
			log.Printf("Failed to write record to year %s file: %v - Record: %v", yearStr, err, record)
			// Consider if you want to stop processing for this year or just log the error
		}
	}

	// Flush all writers and close all files
	log.Println("Flushing writers and closing files...")
	for year, writer := range yearWriters {
		writer.Flush()
		if err := writer.Error(); err != nil {
			log.Printf("Error flushing writer for year %s: %v", year, err)
		}
		if f, ok := yearFiles[year]; ok {
			if err := f.Close(); err != nil {
				log.Printf("Error closing file for year %s: %v", year, err)
			}
		}
	}

	log.Printf("Processing complete. Total rows processed (excluding header): %d", rowCount)
}