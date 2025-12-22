import { useState } from "react";
import { TrendingUp, Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppreciationPresets, PresetValues, AppreciationPreset } from "@/hooks/useAppreciationPresets";
import { useToast } from "@/hooks/use-toast";

const defaultFormData = {
  name: "",
  constructionAppreciation: 12,
  growthAppreciation: 8,
  matureAppreciation: 4,
  growthPeriodYears: 5,
  rentGrowthRate: 4,
};

const PresetsManager = () => {
  const { presets, loading, saving, savePreset, updatePreset, deletePreset } = useAppreciationPresets();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AppreciationPreset | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const resetFormData = () => setFormData(defaultFormData);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    const values: PresetValues = {
      constructionAppreciation: formData.constructionAppreciation,
      growthAppreciation: formData.growthAppreciation,
      matureAppreciation: formData.matureAppreciation,
      growthPeriodYears: formData.growthPeriodYears,
      rentGrowthRate: formData.rentGrowthRate,
    };

    const success = await savePreset(formData.name, values);
    if (success) {
      setCreateOpen(false);
      resetFormData();
    }
  };

  const handleEdit = (preset: AppreciationPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      constructionAppreciation: preset.construction_appreciation,
      growthAppreciation: preset.growth_appreciation,
      matureAppreciation: preset.mature_appreciation,
      growthPeriodYears: preset.growth_period_years,
      rentGrowthRate: preset.rent_growth_rate ?? 4,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPreset || !formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    const values: PresetValues = {
      constructionAppreciation: formData.constructionAppreciation,
      growthAppreciation: formData.growthAppreciation,
      matureAppreciation: formData.matureAppreciation,
      growthPeriodYears: formData.growthPeriodYears,
      rentGrowthRate: formData.rentGrowthRate,
    };

    const success = await updatePreset(editingPreset.id, formData.name, values);
    if (success) {
      setEditOpen(false);
      setEditingPreset(null);
      resetFormData();
    }
  };

  const handleDelete = async (id: string) => {
    await deletePreset(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CCFF00]/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-[#CCFF00]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Appreciation Presets</h2>
            <p className="text-gray-400">Custom capital appreciation profiles for cashflow calculations</p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2">
              <Plus className="w-4 h-4" />
              Create Preset
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Create Appreciation Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Preset Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Conservative Growth"
                  className="bg-[#0d1117] border-[#2a3142] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Construction Appreciation (%)</label>
                  <Input
                    type="number"
                    value={formData.constructionAppreciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, constructionAppreciation: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#0d1117] border-[#2a3142] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Growth Appreciation (%)</label>
                  <Input
                    type="number"
                    value={formData.growthAppreciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, growthAppreciation: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#0d1117] border-[#2a3142] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Mature Appreciation (%)</label>
                  <Input
                    type="number"
                    value={formData.matureAppreciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, matureAppreciation: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#0d1117] border-[#2a3142] text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Growth Period (Years)</label>
                  <Input
                    type="number"
                    value={formData.growthPeriodYears}
                    onChange={(e) => setFormData(prev => ({ ...prev, growthPeriodYears: parseInt(e.target.value) || 5 }))}
                    className="bg-[#0d1117] border-[#2a3142] text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs text-gray-400">Rent Growth Rate (%)</label>
                  <Input
                    type="number"
                    value={formData.rentGrowthRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rentGrowthRate: parseFloat(e.target.value) || 0 }))}
                    className="bg-[#0d1117] border-[#2a3142] text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Preset"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#CCFF00]" />
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1f2e] rounded-xl border border-[#2a3142]">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">No Presets Yet</h3>
          <p className="text-gray-400 mb-4">Create your first appreciation preset to use in the Cashflow Generator</p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Preset
          </Button>
        </div>
      ) : (
        <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3142] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a3142]">
                <th className="text-left text-xs font-medium text-gray-400 p-4">Name</th>
                <th className="text-center text-xs font-medium text-gray-400 p-4">Construction %</th>
                <th className="text-center text-xs font-medium text-gray-400 p-4">Growth %</th>
                <th className="text-center text-xs font-medium text-gray-400 p-4">Mature %</th>
                <th className="text-center text-xs font-medium text-gray-400 p-4">Growth Period</th>
                <th className="text-center text-xs font-medium text-gray-400 p-4">Rent Growth</th>
                <th className="text-right text-xs font-medium text-gray-400 p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id} className="border-b border-[#2a3142] last:border-0 hover:bg-[#2a3142]/30">
                  <td className="p-4">
                    <span className="font-medium text-white">{preset.name}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[#CCFF00] font-medium">{preset.construction_appreciation}%</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-cyan-400 font-medium">{preset.growth_appreciation}%</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-300">{preset.mature_appreciation}%</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-300">{preset.growth_period_years} yrs</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-300">{preset.rent_growth_rate ?? 0}%</span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(preset)}
                      className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(preset.id)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) {
          setEditingPreset(null);
          resetFormData();
        }
      }}>
        <DialogContent className="bg-[#1a1f2e] border-[#2a3142] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Appreciation Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Preset Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Conservative Growth"
                className="bg-[#0d1117] border-[#2a3142] text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Construction Appreciation (%)</label>
                <Input
                  type="number"
                  value={formData.constructionAppreciation}
                  onChange={(e) => setFormData(prev => ({ ...prev, constructionAppreciation: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#0d1117] border-[#2a3142] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Growth Appreciation (%)</label>
                <Input
                  type="number"
                  value={formData.growthAppreciation}
                  onChange={(e) => setFormData(prev => ({ ...prev, growthAppreciation: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#0d1117] border-[#2a3142] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Mature Appreciation (%)</label>
                <Input
                  type="number"
                  value={formData.matureAppreciation}
                  onChange={(e) => setFormData(prev => ({ ...prev, matureAppreciation: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#0d1117] border-[#2a3142] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Growth Period (Years)</label>
                <Input
                  type="number"
                  value={formData.growthPeriodYears}
                  onChange={(e) => setFormData(prev => ({ ...prev, growthPeriodYears: parseInt(e.target.value) || 5 }))}
                  className="bg-[#0d1117] border-[#2a3142] text-white"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs text-gray-400">Rent Growth Rate (%)</label>
                <Input
                  type="number"
                  value={formData.rentGrowthRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rentGrowthRate: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#0d1117] border-[#2a3142] text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-[#2a3142] text-gray-300 hover:bg-[#2a3142]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={saving}
                className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Preset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresetsManager;
