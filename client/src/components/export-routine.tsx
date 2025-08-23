import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Share2, FileText, Link2, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportRoutineProps {
  routineId: string;
  routineName: string;
  className?: string;
}

interface Exercise {
  id: string;
  name: string;
  description?: string;
  duration: number;
  sets?: number;
  reps?: number;
  category: string;
  difficulty: string;
  equipment?: string;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  totalDuration: number;
  exerciseCount: number;
  classType?: {
    name: string;
  };
  exercises: Exercise[];
}

export default function ExportRoutine({ routineId, routineName, className }: ExportRoutineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: routine, isLoading } = useQuery<Routine>({
    queryKey: ["/api/routines", routineId],
    enabled: isOpen && !!routineId,
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/shared/routine/${routineId}`;
    setShareUrl(url);
    return url;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    if (!routine) return;
    
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header - Routine Name
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(routine.name, margin, yPosition);
      yPosition += 12;

      // Class Type
      if (routine.classType) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Class Type: ${routine.classType.name}`, margin, yPosition);
        yPosition += 10;
      }

      // Routine Summary
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Duration: ${formatDuration(routine.totalDuration)} | Exercises: ${routine.exerciseCount}`, margin, yPosition);
      yPosition += 8;

      // Description
      if (routine.description) {
        const splitDescription = pdf.splitTextToSize(routine.description, pageWidth - 2 * margin);
        pdf.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 5 + 8;
      }

      yPosition += 5;

      // Table Header
      const tableStartY = yPosition;
      const colWidths = [15, 50, 25, 20, 20, 25, 35]; // Column widths
      const rowHeight = 8;
      
      // Draw header background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight + 4, 'F');
      
      // Header text
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      let xPosition = margin + 2;
      
      const headers = ['#', 'Exercise Name', 'Duration', 'Sets', 'Reps', 'Difficulty', 'Equipment'];
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition + 5);
        xPosition += colWidths[index];
      });
      
      yPosition += rowHeight + 4;

      // Table rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      
      routine.exercises.forEach((exercise, index) => {
        // Check if we need a new page
        if (yPosition + rowHeight > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
          
          // Redraw header on new page
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight + 4, 'F');
          
          pdf.setFont("helvetica", "bold");
          xPosition = margin + 2;
          headers.forEach((header, idx) => {
            pdf.text(header, xPosition, yPosition + 5);
            xPosition += colWidths[idx];
          });
          
          yPosition += rowHeight + 4;
          pdf.setFont("helvetica", "normal");
        }

        // Draw row border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight + 4);
        
        // Row data
        xPosition = margin + 2;
        const rowData = [
          (index + 1).toString(),
          exercise.name.length > 25 ? exercise.name.substring(0, 22) + '...' : exercise.name,
          exercise.duration ? `${exercise.duration}min` : '-',
          exercise.sets ? exercise.sets.toString() : '-',
          exercise.reps ? exercise.reps.toString() : '-',
          exercise.difficulty || '-',
          exercise.equipment && exercise.equipment.length > 15 ? 
            exercise.equipment.substring(0, 12) + '...' : (exercise.equipment || '-')
        ];
        
        rowData.forEach((data, idx) => {
          pdf.text(data, xPosition, yPosition + 5);
          xPosition += colWidths[idx];
        });
        
        yPosition += rowHeight + 4;
      });

      // Add exercise descriptions section if any exist
      const exercisesWithDescriptions = routine.exercises.filter(ex => ex.description);
      if (exercisesWithDescriptions.length > 0) {
        yPosition += 10;
        
        // Check if we need a new page for descriptions
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Exercise Descriptions:", margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        
        exercisesWithDescriptions.forEach((exercise, index) => {
          const exerciseIndex = routine.exercises.findIndex(ex => ex.id === exercise.id) + 1;
          
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.setFont("helvetica", "bold");
          pdf.text(`${exerciseIndex}. ${exercise.name}:`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFont("helvetica", "normal");
          const splitDesc = pdf.splitTextToSize(exercise.description!, pageWidth - 2 * margin - 5);
          pdf.text(splitDesc, margin + 5, yPosition);
          yPosition += splitDesc.length * 4 + 8;
        });
      }

      // Footer
      const now = new Date();
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(`Generated by FitFlow on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 
        margin, pdf.internal.pageSize.getHeight() - 10);

      pdf.save(`${routine.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Routine exported successfully with organized layout!",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const shareViaEmail = () => {
    const url = generateShareUrl();
    const subject = encodeURIComponent(`Check out this workout routine: ${routineName}`);
    const body = encodeURIComponent(`I'd like to share this workout routine with you:\n\n${routineName}\n\nView it here: ${url}\n\nGenerated by FitFlow`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className} data-testid="export-routine-trigger">
          <Share2 className="w-4 h-4 mr-2" />
          Export & Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="export-routine-description">
        <DialogHeader>
          <DialogTitle>Export & Share Routine</DialogTitle>
          <DialogDescription id="export-routine-description">
            Export your routine as PDF or share it with others
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" data-testid="tab-export">Export PDF</TabsTrigger>
            <TabsTrigger value="share" data-testid="tab-share">Share Routine</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  PDF Export
                </CardTitle>
                <CardDescription>
                  Generate a professional PDF with organized spreadsheet-style layout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">Loading routine details...</div>
                ) : routine ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{routine.name}</h4>
                      {routine.description && (
                        <p className="text-sm text-gray-600">{routine.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDuration(routine.totalDuration)}</span>
                        <span>{routine.exerciseCount} exercises</span>
                        {routine.classType && (
                          <Badge variant="outline">{routine.classType.name}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="w-full"
                      data-testid="button-export-pdf"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? "Generating PDF..." : "Download PDF"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Failed to load routine details
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Link2 className="w-5 h-5 mr-2" />
                  Share Link
                </CardTitle>
                <CardDescription>
                  Generate a shareable link for this routine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="share-url">Shareable URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="share-url"
                      value={shareUrl || generateShareUrl()}
                      readOnly
                      data-testid="input-share-url"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(shareUrl || generateShareUrl())}
                      data-testid="button-copy-url"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    onClick={shareViaEmail}
                    className="justify-start"
                    data-testid="button-share-email"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share Options</CardTitle>
                <CardDescription>
                  Additional ways to share your routine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Share the link with clients or fellow trainers</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Recipients can view the routine without an account</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Combine with PDF export for complete workout packages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}