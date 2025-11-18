import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CSVRow, ValidationStats } from '@/types/csv';
import { validatePhoneNumber, cleanPhoneNumber, detectTelco, autoFixPhoneNumber } from '@/utils/phoneValidation';
import { FileSpreadsheet, Download, CheckCircle, AlertCircle, AlertTriangle, Users, Wand2, Search, Filter } from 'lucide-react';

const Index = () => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTelco, setSelectedTelco] = useState<string>('all');
  const [selectedBundleSize, setSelectedBundleSize] = useState<string>('all');
  const { toast } = useToast();

  const stats: ValidationStats = useMemo(() => {
    const phoneNumbers = new Set();
    let duplicateCount = 0;

    const result = {
      total: data.length,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      warnings: 0
    };

    data.forEach(row => {
      if (phoneNumbers.has(row.phoneNumber)) {
        duplicateCount++;
      }
      phoneNumbers.add(row.phoneNumber);

      switch (row.status) {
        case 'valid':
          result.valid++;
          break;
        case 'invalid':
          result.invalid++;
          break;
        case 'duplicate':
          result.duplicates++;
          break;
        case 'warning':
          result.warnings++;
          break;
      }
    });

    result.duplicates = duplicateCount;
    return result;
  }, [data]);

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedData: CSVRow[] = results.data.map((row: any, index) => {
          const phoneNumber = row.phoneNumber || row.phone || row.Phone || row['Phone Number'] || '';
          const bundleSize = row.bundleSize || row.bundle || row.Bundle || row['Bundle Size'] || '';
          
          const cleanedPhone = cleanPhoneNumber(phoneNumber);
          const validation = validatePhoneNumber(cleanedPhone);
          const telco = detectTelco(cleanedPhone);
          
          return {
            id: `row-${index}`,
            phoneNumber: cleanedPhone || phoneNumber,
            bundleSize,
            telco,
            status: validation.isValid ? 'valid' : 'invalid',
            errors: validation.errors,
            originalData: row
          };
        });

        // Detect duplicates
        const phoneMap = new Map<string, number>();
        processedData.forEach(row => {
          const count = phoneMap.get(row.phoneNumber) || 0;
          phoneMap.set(row.phoneNumber, count + 1);
        });

        processedData.forEach(row => {
          if (phoneMap.get(row.phoneNumber)! > 1 && row.status === 'valid') {
            row.status = 'duplicate';
          }
        });

        // Sort by bundle size (assuming numeric)
        processedData.sort((a, b) => {
          const sizeA = parseFloat(a.bundleSize) || 0;
          const sizeB = parseFloat(b.bundleSize) || 0;
          return sizeB - sizeA;
        });

        setData(processedData);
        
        toast({
          title: 'File uploaded successfully',
          description: `Processed ${processedData.length} rows`
        });
      },
      error: (error) => {
        toast({
          title: 'Error parsing CSV',
          description: error.message,
          variant: 'destructive'
        });
      }
    });
  };

  const handleUpdateRow = (id: string, field: keyof CSVRow, value: string) => {
    setData(prevData => 
      prevData.map(row => {
        if (row.id !== id) return row;
        
        const updated = { ...row, [field]: value };
        
        if (field === 'phoneNumber') {
          const cleaned = cleanPhoneNumber(value);
          const validation = validatePhoneNumber(cleaned);
          const telco = detectTelco(cleaned);
          
          updated.phoneNumber = cleaned || value;
          updated.telco = telco;
          updated.status = validation.isValid ? 'valid' : 'invalid';
          updated.errors = validation.errors;
        }
        
        return updated;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    setData(prevData => prevData.filter(row => row.id !== id));
    toast({
      title: 'Row deleted',
      description: 'Row has been removed from the dataset'
    });
  };

  const handleAutoFixRow = (id: string) => {
    setData(prevData => 
      prevData.map(row => {
        if (row.id !== id) return row;
        
        const fixed = autoFixPhoneNumber(row.phoneNumber);
        const validation = validatePhoneNumber(fixed);
        const telco = detectTelco(fixed);
        
        return {
          ...row,
          phoneNumber: fixed,
          telco,
          status: validation.isValid ? 'valid' : 'invalid',
          errors: validation.errors
        };
      })
    );
  };

  const handleBatchAutoFix = () => {
    let fixedCount = 0;
    let successfulFixes = 0;
    
    setData(prevData => 
      prevData.map(row => {
        if (row.status !== 'invalid') return row;
        
        fixedCount++;
        const fixed = autoFixPhoneNumber(row.phoneNumber);
        const validation = validatePhoneNumber(fixed);
        const telco = detectTelco(fixed);
        
        const wasFixed = validation.isValid;
        if (wasFixed) successfulFixes++;
        
        return {
          ...row,
          phoneNumber: fixed,
          telco,
          status: validation.isValid ? 'valid' : 'invalid',
          errors: validation.errors
        };
      })
    );

    toast({
      title: 'Batch Auto-Fix Complete',
      description: `Successfully fixed ${successfulFixes} out of ${fixedCount} invalid records`,
    });
  };

  const handleExport = () => {
    const validFilteredData = filteredData.filter(row => row.status === 'valid');
    
    if (validFilteredData.length === 0) {
      toast({
        title: 'No valid data to export',
        description: 'Please fix validation errors or adjust filters',
        variant: 'destructive'
      });
      return;
    }

    const csvContent = Papa.unparse(
      validFilteredData.map(row => ({
        phoneNumber: row.phoneNumber,
        bundleSize: row.bundleSize,
        telco: row.telco
      }))
    );

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleaned_${fileName || 'data.csv'}`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${validFilteredData.length} valid records`
    });
  };

  const uniqueTelcos = useMemo(() => {
    const telcos = new Set(data.map(row => row.telco).filter(Boolean));
    return Array.from(telcos).sort();
  }, [data]);

  const uniqueBundleSizes = useMemo(() => {
    const sizes = new Set(data.map(row => row.bundleSize).filter(Boolean));
    return Array.from(sizes).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = data;

    // Filter by tab
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'valid':
          filtered = filtered.filter(row => row.status === 'valid');
          break;
        case 'invalid':
          filtered = filtered.filter(row => row.status === 'invalid');
          break;
        case 'duplicates':
          filtered = filtered.filter(row => row.status === 'duplicate');
          break;
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by telco
    if (selectedTelco !== 'all') {
      filtered = filtered.filter(row => row.telco === selectedTelco);
    }

    // Filter by bundle size
    if (selectedBundleSize !== 'all') {
      filtered = filtered.filter(row => row.bundleSize === selectedBundleSize);
    }

    return filtered;
  }, [data, activeTab, searchTerm, selectedTelco, selectedBundleSize]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Smart CSV Data Cleaner
          </h1>
          <p className="text-muted-foreground">
            Upload, validate, and clean your customer data with ease
          </p>
        </div>

        {data.length === 0 ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Records"
                value={stats.total}
                icon={Users}
                variant="default"
              />
              <StatCard
                title="Valid"
                value={stats.valid}
                icon={CheckCircle}
                variant="success"
              />
              <StatCard
                title="Invalid"
                value={stats.invalid}
                icon={AlertCircle}
                variant="destructive"
              />
              <StatCard
                title="Duplicates"
                value={stats.duplicates}
                icon={AlertTriangle}
                variant="warning"
              />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" />
                {fileName}
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setData([]);
                    setFileName('');
                  }}
                >
                  Upload New File
                </Button>
                {stats.invalid > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleBatchAutoFix}
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Auto-Fix All ({stats.invalid})
                  </Button>
                )}
                <Button onClick={handleExport} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Clean Data
                </Button>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Search & Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search phone numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedTelco} onValueChange={setSelectedTelco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Telco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Telcos</SelectItem>
                    {uniqueTelcos.map(telco => (
                      <SelectItem key={telco} value={telco}>{telco}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedBundleSize} onValueChange={setSelectedBundleSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Bundle Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bundle Sizes</SelectItem>
                    {uniqueBundleSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="valid" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Valid ({stats.valid})
                </TabsTrigger>
                <TabsTrigger value="invalid" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Invalid ({stats.invalid})
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Duplicates ({stats.duplicates})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <DataTable
                  data={filteredData}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={handleDeleteRow}
                  onAutoFixRow={handleAutoFixRow}
                />
              </TabsContent>
              <TabsContent value="valid">
                <DataTable
                  data={filteredData}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={handleDeleteRow}
                  onAutoFixRow={handleAutoFixRow}
                />
              </TabsContent>
              <TabsContent value="invalid">
                <DataTable
                  data={filteredData}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={handleDeleteRow}
                  onAutoFixRow={handleAutoFixRow}
                />
              </TabsContent>
              <TabsContent value="duplicates">
                <DataTable
                  data={filteredData}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={handleDeleteRow}
                  onAutoFixRow={handleAutoFixRow}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
