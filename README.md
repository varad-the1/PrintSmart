
## PrintSmart
A simple tool I built to fix one stupidly annoying real-life problem.

Whenever I go to take printouts, I usually have multiple PDFs. Some of them have odd pages, and when printed double-sided, everything gets misaligned and messy. So I end up manually merging files and checking page counts like an idiot every time.

## What it does
Upload multiple PDF files
Automatically checks page count for each file
If a file has an odd number of pages, it adds a blank page at the end
Merges everything into one clean PDF
Lets you download the final file (ready for printing)

## Why this exists

Because standing in a print shop queue and realizing your pages are messed up is pain.

This just removes that friction.

## How it works (simple logic)
For each PDF:

Odd pages → add a blank page

Even pages → leave it as is
Then merge all PDFs in order.

## Author
Built by Varad Tonpe
Because print shops were wasting my time.
