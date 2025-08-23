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
      const margin = 20;
      let yPosition = margin;

      // Title
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(routine.name, margin, yPosition);
      yPosition += 15;

      // Description
      if (routine.description) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        const splitDescription = pdf.splitTextToSize(routine.description, pageWidth - 2 * margin);
        pdf.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 6 + 10;
      }

      // Routine Info
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Routine Details", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Duration: ${formatDuration(routine.totalDuration)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Exercises: ${routine.exerciseCount}`, margin, yPosition);
      yPosition += 6;
      if (routine.classType) {
        pdf.text(`Class Type: ${routine.classType.name}`, margin, yPosition);
        yPosition += 6;
      }
      yPosition += 10;

      // Exercises
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Exercises", margin, yPosition);
      yPosition += 10;

      routine.exercises.forEach((exercise, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${index + 1}. ${exercise.name}`, margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        
        if (exercise.description) {
          const splitDesc = pdf.splitTextToSize(exercise.description, pageWidth - 2 * margin - 10);
          pdf.text(splitDesc, margin + 10, yPosition);
          yPosition += splitDesc.length * 5 + 3;
        }

        // Exercise details
        const details = [];
        if (exercise.duration) details.push(`Duration: ${exercise.duration}min`);
        if (exercise.sets && exercise.reps) details.push(`Sets: ${exercise.sets} x ${exercise.reps}`);
        details.push(`Category: ${exercise.category}`);
        details.push(`Difficulty: ${exercise.difficulty}`);
        if (exercise.equipment) details.push(`Equipment: ${exercise.equipment}`);

        pdf.text(details.join(" | "), margin + 10, yPosition);
        yPosition += 12;
      });

      // Footer
      const now = new Date();
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(`Generated by FitFlow on ${now.toLocaleDateString()}`, margin, pdf.internal.pageSize.getHeight() - 10);

      pdf.save(`${routine.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Routine exported successfully!",
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
                  Generate a professional PDF with complete routine details and exercises
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