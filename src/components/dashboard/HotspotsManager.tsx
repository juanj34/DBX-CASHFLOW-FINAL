import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HotspotForm from "./HotspotForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const HotspotsManager = () => {
  const { t } = useLanguage();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<any>(null);
  const [deletingHotspot, setDeletingHotspot] = useState<any>(null);
  const { toast } = useToast();

  const fetchHotspots = async () => {
    const { data, error } = await supabase
      .from("hotspots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: t('errorFetchingHotspots'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setHotspots(data || []);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  const handleDelete = async () => {
    if (!deletingHotspot) return;

    const { error } = await supabase
      .from("hotspots")
      .delete()
      .eq("id", deletingHotspot.id);

    if (error) {
      toast({
        title: t('errorDeletingHotspot'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('hotspotDeleted'),
        description: t('hotspotDeletedSuccess'),
      });
      fetchHotspots();
    }
    setDeletingHotspot(null);
  };

  const filteredHotspots = hotspots.filter((hotspot) => {
    const matchesSearch = hotspot.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || hotspot.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      landmark: "bg-blue-500",
      district: "bg-violet-500",
      masterplan: "bg-amber-500",
      residential: "bg-emerald-500",
      waterfront: "bg-cyan-500",
      retail: "bg-pink-500",
      leisure: "bg-orange-500",
      golf: "bg-green-500",
      infrastructure: "bg-slate-500",
      heritage: "bg-purple-500",
      metro: "bg-purple-500",
      attraction: "bg-pink-500",
      project: "bg-emerald-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-theme-text">{t('hotspotsManagement')}</h2>
        <Button onClick={() => setShowForm(true)} className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('addHotspot')}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-theme-text-muted" />
          <Input
            placeholder={t('searchHotspots')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-theme-card border-theme-border text-theme-text placeholder:text-theme-text-muted"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-theme-card border-theme-border text-theme-text">
            <SelectValue placeholder={t('filterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            <SelectItem value="landmark">🏛️ {t('catLandmark')}</SelectItem>
            <SelectItem value="district">🏙️ {t('catDistrict')}</SelectItem>
            <SelectItem value="masterplan">🗺️ {t('catMasterplan')}</SelectItem>
            <SelectItem value="residential">🏠 {t('catResidential')}</SelectItem>
            <SelectItem value="waterfront">🌊 {t('catWaterfront')}</SelectItem>
            <SelectItem value="retail">🛍️ {t('catRetail')}</SelectItem>
            <SelectItem value="leisure">⭐ {t('catLeisure')}</SelectItem>
            <SelectItem value="golf">⛳ {t('catGolf')}</SelectItem>
            <SelectItem value="infrastructure">✈️ {t('catInfrastructure')}</SelectItem>
            <SelectItem value="heritage">🧭 {t('catHeritage')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-theme-border bg-theme-card overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="border-theme-border hover:bg-theme-card-alt">
              <TableHead className="text-theme-text">{t('title')}</TableHead>
              <TableHead className="text-theme-text">{t('category')}</TableHead>
              <TableHead className="text-theme-text">{t('location')}</TableHead>
              <TableHead className="text-right text-theme-text">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHotspots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-theme-text-muted">
                  {t('noHotspotsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredHotspots.map((hotspot) => (
                <TableRow key={hotspot.id} className="border-theme-border hover:bg-theme-card-alt">
                  <TableCell className="font-medium text-theme-text">{hotspot.title}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(hotspot.category)}>
                      {hotspot.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-theme-text-muted">
                    {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingHotspot(hotspot);
                        setShowForm(true);
                      }}
                      className="hover:bg-theme-card-alt"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingHotspot(hotspot)}
                      className="hover:bg-theme-card-alt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <HotspotForm
          hotspot={editingHotspot}
          onClose={() => {
            setShowForm(false);
            setEditingHotspot(null);
          }}
          onSaved={() => {
            fetchHotspots();
            setShowForm(false);
            setEditingHotspot(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingHotspot} onOpenChange={() => setDeletingHotspot(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t('deleteHotspot')}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t('deleteHotspotConfirm')} "{deletingHotspot?.title}"? {t('actionCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-theme-card border-theme-border text-theme-text hover:bg-theme-card-alt">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HotspotsManager;
