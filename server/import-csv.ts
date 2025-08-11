import fs from 'fs';
import { parse } from 'csv-parse';
import { db } from './db';
import { contacts } from '../shared/schema';

async function importCSV() {
  const csvPath = './import_file.csv';
  const results: any[] = [];
  
  console.log('Starting CSV import...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(parse({ 
        columns: true, 
        skip_empty_lines: true,
        trim: true 
      }))
      .on('data', (data) => results.push(data))
      .on('error', (error) => reject(error))
      .on('end', async () => {
        console.log(`Found ${results.length} records to import`);
        
        let imported = 0;
        let errors = 0;
        
        // Process in batches for better performance
        const batchSize = 100;
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(results.length/batchSize)} (${batch.length} records)`);
          
          const contactsToInsert = batch.map(row => {
            const name = row.name?.toString().trim() || '';
            const phone = row.phone_number?.toString().trim() || '';
            
            return {
              name: name || 'Unknown Lab',
              phone: phone,
              phoneNumber: phone,
              email: (row.email?.toString().trim() && row.email.trim() !== '') ? row.email.trim() : null,
              city: (row.city?.toString().trim() && row.city.trim() !== '') ? row.city.trim() : null,
              state: (row.state?.toString().trim() && row.state.trim() !== '') ? row.state.trim() : null,
              importedFrom: 'csv_bulk_import'
            };
          }).filter(contact => contact.phone !== '' && contact.name !== '');
          
          try {
            await db.insert(contacts)
              .values(contactsToInsert)
              .onConflictDoNothing(); // Skip duplicates
            
            imported += contactsToInsert.length;
            console.log(`✓ Batch completed: ${contactsToInsert.length} contacts`);
          } catch (error: any) {
            console.error(`✗ Batch failed:`, error.message);
            errors += batch.length;
          }
        }
        
        console.log(`\n🎉 Import completed!`);
        console.log(`✓ Successfully imported: ${imported} contacts`);
        console.log(`✗ Errors: ${errors} records`);
        resolve({ imported, errors });
      });
  });
}

// Run the import
importCSV()
  .then(() => {
    console.log('Import process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });

export { importCSV };